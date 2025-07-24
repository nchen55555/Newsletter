"use client"
 
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, SquareArrowUpRight } from "lucide-react"
import Link from 'next/link'


export type CompanyProfile = {
    id: string; 
    alt: string;
    caption: string;
    description: string;
    image: string;
    tags: string[];
    publishedAt: string;
}

export const columns: ColumnDef<CompanyProfile>[] = [
    {
      accessorKey: "alt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>
        )
      },
  
    },
    {
      accessorKey: "caption",
      header: "Caption",
    },
    {
      accessorKey: "tags",
      header: "Media",
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[]
        return (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag, index) => {
              return (
                <Link href={tag} key={index} title={`View Article ${index + 1}`}>
                  <SquareArrowUpRight className="h-5 w-5 text-gray-600 hover:text-gray-900 transition-colors" />
                </Link>
              )
            })}
          </div>
        )
      },
    },
  ]

