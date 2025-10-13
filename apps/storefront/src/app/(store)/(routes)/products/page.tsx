import { ProductGrid, ProductSkeletonGrid } from '@/components/native/Product'
import { Heading } from '@/components/native/heading'
import { Separator } from '@/components/native/separator'
import prisma from '@/lib/prisma'
import { isVariableValid } from '@/lib/utils'

import {
   ProductSearch,
   PriceRange,
   BrandCombobox,
   CategoriesCombobox,
   SortBy,
   // AvailableToggle,
} from './components/options'

export default async function Products({ searchParams }) {
   const { search, minPrice, maxPrice, sort, isAvailable, brand, category, page = 1 } = searchParams ?? null

   const minimumPrice = parseFloat(minPrice);
   const maximumPrice = parseFloat(maxPrice);

   const minMaxPriceFilter = !isNaN(minimumPrice) && !isNaN(maximumPrice) 
   ? { price: { gte: minimumPrice, lte: maximumPrice } } 
   : {};

   const filteredCategories = category ? 
      category
         .split('+')
         .map((cat) => cat.trim())
      : 
      undefined

   const isTitleSort = sort === "title_asc" || sort === "title_desc"

   const orderBy = getOrderBy(sort)

   const brands = await prisma.brand.findMany()
   const categories = await prisma.category.findMany()
   const products = await prisma.product.findMany({
      where: {
         AND: [
            {
               isAvailable: (isAvailable == 'true' || sort) && !isTitleSort ? true : undefined,
            },
            {
               OR: [
                  {
                     title: {
                     contains: search,
                     mode: 'insensitive',
                     },
                  },
                  {
                     description: {
                     contains: search,
                     mode: 'insensitive',
                     },
                  },
               ],
            },
            {
               ...(brand
                  ? {
                     brand: {
                        title: {
                           in: brand.split('+').map((b) => b.trim()),
                           mode: 'insensitive',
                        },
                     },
                  }
                  : {}),
            },
            {
               categories: {
                  some: {
                     title: {
                        in: filteredCategories,
                        mode: 'insensitive',
                     },
                  },
               },
            },
            {
               ...minMaxPriceFilter
            }
         ],
      },
      orderBy,
      skip: (page - 1) * 12,
      take: 12,
      include: {
         brand: true,
         categories: true,
      },
   });

   return (
      <>
         <Heading
            title="Products"
            description="Below is a list of products you have in your cart."
         />
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            <ProductSearch initialSearch={search} />
            <PriceRange />
            {/* <PriceRange minLimit={minimumPrice} maxLimit={maximumPrice}/> */}
            <CategoriesCombobox
               initialCategory={category}
               categories={categories}
            />
            <BrandCombobox initialBrand={brand} brands={brands} />
            <SortBy initialData={sort} />
            {/* <AvailableToggle initialData={isAvailable} /> */}
         </div>
         <Separator />
         {isVariableValid(products) ? (
            <ProductGrid products={products} />
         ) : (
            <ProductSkeletonGrid />
         )}
      </>
   )
}

function getOrderBy(sort) {
   let orderBy

   switch (sort) {
      case 'featured':
         orderBy = {
            orders: {
               _count: 'desc',
            },
         }
         break
      case 'most_expensive':
         orderBy = {
            price: 'desc',
         }
         break
      case 'least_expensive':
         orderBy = {
            price: 'asc',
         }
         break
      case 'title_asc':
         orderBy = {
            title: 'asc',
         }
         break
      case 'title_desc':
         orderBy = {
            title: 'desc',
         }
         break

      default:
         orderBy = {
            orders: {
               _count: 'desc',
            },
         }
         break
   }

   return orderBy
}
