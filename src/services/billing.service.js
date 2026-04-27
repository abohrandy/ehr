const db = require('../db/knex');

/**
 * Create an invoice.
 */
async function createInvoice(data) {
    const [invoice] = await db('invoices')
        .insert(data)
        .returning('*');

    return invoice;
}

/**
 * List invoices with optional filters.
 */
async function listInvoices(filters, userId, role) {
    let query = db('invoices')
        .leftJoin('clients', 'invoices.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .select(
            'invoices.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name'
        );

    // Role-based filtering
    if (role === 'therapist') {
        query = query.whereIn('invoices.client_id',
            db('clients').where({ assigned_therapist_id: userId }).select('id')
        );
    } else if (role === 'client') {
        query = query.whereIn('invoices.client_id',
            db('clients').where({ user_id: userId }).select('id')
        );
    }

    if (filters.client_id) query = query.where('invoices.client_id', filters.client_id);
    if (filters.status) query = query.where('invoices.status', filters.status);

    return query.orderBy('invoices.created_at', 'desc');
}

/**
 * Get invoice by ID.
 */
async function getInvoiceById(invoiceId) {
    const invoice = await db('invoices')
        .leftJoin('clients', 'invoices.client_id', 'clients.id')
        .leftJoin('users as client_user', 'clients.user_id', 'client_user.id')
        .select(
            'invoices.*',
            'client_user.first_name as client_first_name',
            'client_user.last_name as client_last_name'
        )
        .where('invoices.id', invoiceId)
        .first();

    if (!invoice) {
        const error = new Error('Invoice not found.');
        error.statusCode = 404;
        throw error;
    }

    return invoice;
}

/**
 * Mark invoice as paid.
 */
async function markPaid(invoiceId) {
    const [invoice] = await db('invoices')
        .where({ id: invoiceId })
        .update({
            status: 'paid',
            paid_at: db.fn.now(),
            updated_at: db.fn.now(),
        })
        .returning('*');

    if (!invoice) {
        const error = new Error('Invoice not found.');
        error.statusCode = 404;
        throw error;
    }

    return invoice;
}

/**
 * Monthly revenue summary.
 */
async function getRevenueSummary(year, month) {
    let query = db('invoices')
        .where({ status: 'paid' })
        .whereRaw('EXTRACT(YEAR FROM paid_at) = ?', [year]);

    if (month) {
        query = query.whereRaw('EXTRACT(MONTH FROM paid_at) = ?', [month]);
    }

    const result = await query
        .select(
            'currency',
            db.raw('EXTRACT(MONTH FROM paid_at) as month'),
            db.raw('SUM(amount) as total_revenue'),
            db.raw('COUNT(*) as invoice_count')
        )
        .groupByRaw('currency, EXTRACT(MONTH FROM paid_at)')
        .orderByRaw('EXTRACT(MONTH FROM paid_at)');

    // totalYear should be grouped by currency
    const totalYearByCurrency = result.reduce((acc, r) => {
        const curr = r.currency || 'NGN';
        acc[curr] = (acc[curr] || 0) + parseFloat(r.total_revenue || 0);
        return acc;
    }, {});

    // breakdown should also be grouped appropriately, or we can just send the raw array of results
    return {
        year,
        month: month || null,
        monthly_breakdown: result.map((r) => ({
            currency: r.currency || 'NGN',
            month: parseInt(r.month, 10),
            total_revenue: parseFloat(r.total_revenue),
            invoice_count: parseInt(r.invoice_count, 10),
        })),
        total_revenue_by_currency: totalYearByCurrency,
    };
}

module.exports = { createInvoice, listInvoices, getInvoiceById, markPaid, getRevenueSummary };
