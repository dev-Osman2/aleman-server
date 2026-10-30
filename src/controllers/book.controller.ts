import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const { category, search } = req.query;

    
    const whereConditions: Prisma.BookWhereInput = {};

    
    if (category && typeof category === "string" && category !== "All") {
      whereConditions.category = category;
    }

    
    if (search && typeof search === "string" && search.trim() !== "") {
      const searchTerm = search.trim();
      whereConditions.OR = [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive", 
          },
        },
        {
          author: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    
    const books = await prisma.book.findMany({
      where: whereConditions
    });

    
    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching books",
    });
  }
};


export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const book = await prisma.book.findUnique({
      where: { code },
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching book details",
    });
  }
};

const getSearchTokens = (value: string | null | undefined): Set<string> =>
  new Set(
    (value || '')
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2)
  );

// Helper function to pick N unique random items from an array
function pickRandomItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const getRelatedBooks = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const currentBook = await prisma.book.findUnique({
      where: { code: String(code) },
    });

    if (!currentBook) {
      return res.status(404).json({ message: 'الكتاب غير موجود' });
    }

    // 1. Fetch available books directly from DB
    const candidates = await prisma.book.findMany({
      where: {
        id: { not: currentBook.id },
        quantity: { gt: 0 },
      },
    });

    const currentTitleTokens = getSearchTokens(currentBook.title);

    // 2. Score candidates with dynamic factors
    const scoredCandidates = candidates
      .map((book) => {
        const titleTokens = getSearchTokens(book.title);
        const titleOverlap = [...currentTitleTokens].filter((token) =>
          titleTokens.has(token)
        ).length;

        const isSameCategory = book.category === currentBook.category;
        const isSameAuthor = Boolean(book.author && book.author === currentBook.author);
        const isSamePublisher = Boolean(book.publisher && book.publisher === currentBook.publisher);

        const score =
          (isSameCategory ? 5 : 0) +
          (isSameAuthor ? 3 : 0) +
          (isSamePublisher ? 1 : 0) +
          titleOverlap * 3;

        return { book, score, isSameCategory };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    const selectedBooks: typeof candidates = [];
    const selectedIds = new Set<string>();

    // 3. Slot 1: Strongest related match (Highest Score)
    if (scoredCandidates.length > 0) {
      const topMatch = scoredCandidates[0].book;
      selectedBooks.push(topMatch);
      selectedIds.add(topMatch.id);
    }

    // 4. Slots 2 & 3: Exploration pool from remaining top category matches (Randomized)
    const categoryPool = scoredCandidates
      .filter(({ book, isSameCategory }) => isSameCategory && !selectedIds.has(book.id))
      .slice(0, 8)
      .map(({ book }) => book);

    const explorationPicks = pickRandomItems(categoryPool, 2);
    explorationPicks.forEach((book) => {
      selectedBooks.push(book);
      selectedIds.add(book.id);
    });

    // 5. Slot 4: Discovery / Serendipity (Cross-category book to break loops)
    const crossCategoryCandidates = candidates.filter(
      (book) => book.category !== currentBook.category && !selectedIds.has(book.id)
    );

    if (crossCategoryCandidates.length > 0) {
      const discoveryPick = pickRandomItems(crossCategoryCandidates, 1)[0];
      selectedBooks.push(discoveryPick);
      selectedIds.add(discoveryPick.id);
    } else {
      // Fallback if no other categories exist
      const fallbackPool = candidates.filter((book) => !selectedIds.has(book.id));
      const fallbackPicks = pickRandomItems(fallbackPool, 1);
      fallbackPicks.forEach((book) => selectedBooks.push(book));
    }

    // If still less than 4 (small database edge case), fill remaining slots
    if (selectedBooks.length < 4) {
      const remainingFillers = candidates.filter((book) => !selectedIds.has(book.id));
      const extraPicks = pickRandomItems(remainingFillers, 4 - selectedBooks.length);
      selectedBooks.push(...extraPicks);
    }

    return res.status(200).json(selectedBooks);
  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ أثناء جلب المقترحات', error });
  }
};