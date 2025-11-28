import React from 'react';

/**
 * Simple component to display a permission warning when a non‑admin user attempts to access a restricted page.
 */
const PermissionWarning = ({ message = 'Você não tem permissão para acessar esta página.' }) => (
    <div className="card border-red-500 bg-red-500/10 text-center p-8 m-5 border rounded-lg">
        <h2 className="text-red-500 font-bold text-xl">{message}</h2>
    </div>
);

export default PermissionWarning;
