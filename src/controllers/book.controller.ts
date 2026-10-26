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