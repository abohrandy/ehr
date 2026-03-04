module.exports = {
    ROLES: {
        ADMIN: 'admin',
        THERAPIST: 'therapist',
        CLIENT: 'client',
    },

    CASE_TYPES: ['individual', 'couple', 'family', 'child'],

    CLIENT_STATUS: ['active', 'inactive', 'discharged'],

    APPOINTMENT_STATUS: ['scheduled', 'completed', 'cancelled', 'no_show'],

    SESSION_TYPES: ['individual', 'couple', 'family', 'child'],

    LOCATIONS: ['in-person', 'telehealth'],

    NOTE_TYPES: ['soap', 'dap', 'progress'],

    RELATIONSHIP_TYPES: ['spouse', 'partner', 'parent', 'child', 'sibling', 'guardian', 'other'],

    TREATMENT_STATUS: ['active', 'completed', 'closed'],

    TREATMENT_CASE_TYPES: ['individual', 'couple', 'family', 'divorce', 'child'],

    INVOICE_STATUS: ['pending', 'paid', 'overdue', 'cancelled'],

    AUDIT_ACTIONS: {
        CREATE: 'CREATE',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        LOCK: 'LOCK',
        EXPORT: 'EXPORT',
    },
};
