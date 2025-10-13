'use client'

import {
    CartesianGrid,
    Legend,
    Line,
    Bar,
    ComposedChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { format } from "date-fns"

interface OrdersOverviewChartProps {
    data: {
        date: string
        orderCount: number
        orderTotal: number
    }[]
}

export const OrdersOverviewChart: React.FC<OrdersOverviewChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), "MMM dd")}
            />
            <YAxis yAxisId="left" label={{ value: "Orders", angle: -90, position: "insideLeft" }} />
            <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "Total ($)", angle: -90, position: "insideRight" }}
            />
            <Tooltip
            formatter={(value: any, name) =>
                name === "orderTotal" ? [`$${value.toLocaleString()}`, "Total"] : [value, "Orders"]
            }
            />
            <Legend />
            <Bar yAxisId="left" dataKey="orderCount" fill="#60a5fa" name="Orders" />
            <Line
            yAxisId="right"
            type="monotone"
            dataKey="orderTotal"
            stroke="#34d399"
            name="Total Sales"
            />
        </ComposedChart>
        </ResponsiveContainer>
    )
}
