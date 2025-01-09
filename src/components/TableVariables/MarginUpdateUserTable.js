import {
    FlexRender,
    getCoreRowModel,
    useVueTable,
    createColumnHelper,
  } from '@tanstack/vue-table'

const columnHelper = createColumnHelper()

 
const margin_update_user_book = [ 
    "strategy" , "qtylimit",
        "cvlimit",
        "factor1",
        "factor2"
];

export const margin_update_user_book_columns  = margin_update_user_book.map(column => {
  return columnHelper.accessor(row => row[column], {
    id: column,
    cell: info => info.getValue(),
    header: () => column,
  });
});
  
