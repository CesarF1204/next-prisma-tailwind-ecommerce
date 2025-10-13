import { eachDayOfInterval, format, min, max } from "date-fns"
import prisma from "@/lib/prisma"
import { formatter } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"

import { BrandCombobox, CategoriesCombobox, DateRangePicker } from "./components/options"

import { OrdersOverviewChart } from "./components/overview-chart"
import { ProductsTable, ProductColumn } from "./components/table"

export default async function AdminReportsPage({ searchParams }) {
    const { startDate, endDate, brand, category } = searchParams ?? {}

    const filteredCategories = category
        ? category.split("+").map((c) => c.trim())
        : undefined

    const brands = await prisma.brand.findMany()
    const categories = await prisma.category.findMany()

    // Orders Report Chart
    const whereClause: any = {}

    // Apply filters only if provided
    if (startDate && endDate) {
        whereClause.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        }
    }

    // Fetch grouped orders
    const orders = await prisma.order.groupBy({
    by: ["createdAt"],
        _count: { id: true },
        _sum: { total: true },
        where: whereClause,
    })

    // Group and summarize orders by date
    const groupedOrders: Record<string, { count: number; total: number }> = {}

    orders.forEach((o) => {
    const date = format(o.createdAt, "yyyy-MM-dd")
    groupedOrders[date] = {
        count: (groupedOrders[date]?.count ?? 0) + o._count.id,
        total: (groupedOrders[date]?.total ?? 0) + (o._sum.total ?? 0),
    }
    })

    // Determine date range dynamically
    let allDates: Date[] = []

    if (startDate && endDate) {
        // Use filter range
        allDates = eachDayOfInterval({
            start: new Date(startDate),
            end: new Date(endDate),
        })
    } else if (orders.length > 0) {
        // Use full order range (oldest to newest)
        const minDate = min(orders.map((o) => o.createdAt))
        const maxDate = max(orders.map((o) => o.createdAt))
        allDates = eachDayOfInterval({ start: minDate, end: maxDate })
        } else {
        // Fallback: show empty chart (no orders at all)
        allDates = [new Date()]
    }

    // Build final chart data
    const chartData = allDates.map((d) => {
    const date = format(d, "yyyy-MM-dd")
    return {
        date,
        orderCount: groupedOrders[date]?.count ?? 0,
        orderTotal: groupedOrders[date]?.total ?? 0,
    }
    })

    // Query to get the products order by most top sales
    const products = await prisma.product.findMany({
        select: {
            id: true,
            title: true,
            price: true,
            discount: true,
            isAvailable: true,
            categories: { select: { title: true } },
            orders: {
            select: {
                order: {
                select: { createdAt: true },
                },
            },
            where: {
                order: {
                ...(startDate &&
                    endDate && {
                    createdAt: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                    }),
                },
            },
            },
            brand: { select: { title: true } },
        },
        where: {
            ...(brand && {
            brand: {
                title: {
                in: brand.split("+").map((b) => b.trim()),
                mode: "insensitive",
                },
            },
            }),
            ...(filteredCategories && filteredCategories.length > 0 && {
            categories: {
                some: {
                title: { in: filteredCategories, mode: "insensitive" },
                },
            },
            }),
        },
        orderBy: {
            orders: {
            _count: "desc",
            },
        },
    })

    const topSellingProducts: ProductColumn[] = products.map((p) => ({
        id: p.id,
        title: p.title,
        price: formatter.format(p.price),
        discount: formatter.format(p.discount),
        category: p.categories[0]?.title ?? "Uncategorized",
        sales: p.orders.length,
        isAvailable: p.isAvailable,
    }))

    return (
        <div className="my-6 space-y-6">
        <Heading title="Reports Overview" description="Sales and order insights" />
        <Separator />

        {/* FILTER OPTIONS */}
        <div className="grid gap-4 grid-cols-3">
            <DateRangePicker
                initialStartDate={startDate}
                initialEndDate={endDate}
            />
            <CategoriesCombobox
                initialCategory={category}
                categories={categories}
            />
            <BrandCombobox initialBrand={brand} brands={brands} />
        </div>

        {/* CHART SECTION */}
        <Card className="col-span-4">
            <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
            <OrdersOverviewChart data={chartData} />
            </CardContent>
        </Card>

        {/* TABLE SECTION */}
        <Card className="col-span-4">
            <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
            <ProductsTable data={topSellingProducts} />
            </CardContent>
        </Card>
        </div>
    )
}
