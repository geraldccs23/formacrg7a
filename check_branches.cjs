
const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkBranches() {
    console.log('--- Checking v_latest_stock_by_branch ---');
    const { data: stockBranches, error: stockError } = await supabase
        .from('v_latest_stock_by_branch')
        .select('branch');

    if (stockError) {
        console.error('Stock Error:', stockError);
    } else {
        const distinctStock = [...new Set(stockBranches.map(s => s.branch))];
        console.log('Distinct branches in stock:', distinctStock);
    }

    console.log('\n--- Checking v_sales_lines ---');
    const { data: salesSucursales, error: salesError } = await supabase
        .from('v_sales_lines')
        .select('sucursal');

    if (salesError) {
        console.error('Sales Error:', salesError);
    } else {
        const distinctSales = [...new Set(salesSucursales.map(s => s.sucursal))];
        console.log('Distinct sucursales in sales:', distinctSales);
    }
}

checkBranches();
