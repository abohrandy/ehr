const db = require('../db/knex');
const bcrypt = require('bcryptjs');

async function createClient(req, res, next) {
    try {
        const { email, password, first_name, last_name, phone, ...clientData } = req.body;

        // Create user account with client role
        const password_hash = await bcrypt.hash(password, 12);
        const [user] = await db('users')
            .insert({ email, password_hash, role: 'client', first_name, last_name, phone })
            .returning('*');

        // Create client profile
        const [client] = await db('clients')
            .insert({
                user_id: user.id,
                assigned_therapist_id: clientData.assigned_therapist_id || req.user.id,
                date_of_birth: clientData.date_of_birth,
                gender: clientData.gender,
                address: clientData.address,
                emergency_contact_name: clientData.emergency_contact_name,
                emergency_contact_phone: clientData.emergency_contact_phone,
                case_type: clientData.case_type || 'individual',
                intake_date: new Date().toISOString().split('T')[0],
            })
            .returning('*');

        res.status(201).json({
            success: true,
            data: {
                ...client,
                user: { id: user.id, email: user.email, first_name, last_name },
            },
        });
    } catch (err) { next(err); }
}

async function listClients(req, res, next) {
    try {
        let query = db('clients')
            .leftJoin('users', 'clients.user_id', 'users.id')
            .select(
                'clients.*',
                'users.email',
                'users.first_name',
                'users.last_name',
                'users.phone'
            );

        // Therapists can only see their own clients
        if (req.user.role === 'therapist') {
            query = query.where('clients.assigned_therapist_id', req.user.id);
        }

        if (req.query.status) query = query.where('clients.status', req.query.status);
        if (req.query.case_type) query = query.where('clients.case_type', req.query.case_type);

        const clients = await query.orderBy('clients.created_at', 'desc');
        res.json({ success: true, data: clients });
    } catch (err) { next(err); }
}

async function getClient(req, res, next) {
    try {
        const client = await db('clients')
            .leftJoin('users', 'clients.user_id', 'users.id')
            .select(
                'clients.*',
                'users.email',
                'users.first_name',
                'users.last_name',
                'users.phone'
            )
            .where('clients.id', req.params.id)
            .first();

        if (!client) return res.status(404).json({ success: false, error: 'Client not found.' });
        res.json({ success: true, data: client });
    } catch (err) { next(err); }
}

async function updateClient(req, res, next) {
    try {
        const { first_name, last_name, phone, ...clientData } = req.body;

        // Update user fields if provided
        if (first_name || last_name || phone) {
            const client = await db('clients').where({ id: req.params.id }).first();
            if (!client) return res.status(404).json({ success: false, error: 'Client not found.' });

            const userUpdates = {};
            if (first_name) userUpdates.first_name = first_name;
            if (last_name) userUpdates.last_name = last_name;
            if (phone) userUpdates.phone = phone;
            userUpdates.updated_at = db.fn.now();
            await db('users').where({ id: client.user_id }).update(userUpdates);
        }

        // Update client fields
        if (Object.keys(clientData).length > 0) {
            clientData.updated_at = db.fn.now();
            await db('clients').where({ id: req.params.id }).update(clientData);
        }

        const updated = await db('clients')
            .leftJoin('users', 'clients.user_id', 'users.id')
            .select('clients.*', 'users.email', 'users.first_name', 'users.last_name', 'users.phone')
            .where('clients.id', req.params.id)
            .first();

        res.json({ success: true, data: updated });
    } catch (err) { next(err); }
}

async function linkRelationship(req, res, next) {
    try {
        const [link] = await db('family_relationship_links')
            .insert(req.body)
            .returning('*');
        res.status(201).json({ success: true, data: link });
    } catch (err) { next(err); }
}

async function getRelationships(req, res, next) {
    try {
        const links = await db('family_relationship_links')
            .where('client_id_1', req.params.id)
            .orWhere('client_id_2', req.params.id);

        // Enrich with client details
        const enriched = [];
        for (const link of links) {
            const otherClientId = link.client_id_1 === req.params.id ? link.client_id_2 : link.client_id_1;
            const otherClient = await db('clients')
                .leftJoin('users', 'clients.user_id', 'users.id')
                .select('clients.id', 'users.first_name', 'users.last_name', 'clients.case_type')
                .where('clients.id', otherClientId)
                .first();

            enriched.push({
                ...link,
                related_client: otherClient,
            });
        }

        res.json({ success: true, data: enriched });
    } catch (err) { next(err); }
}

module.exports = { createClient, listClients, getClient, updateClient, linkRelationship, getRelationships };
