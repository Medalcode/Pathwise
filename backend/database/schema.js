/**
 * Definiciones del Esquema de Base de Datos
 * Responsabilidad Única: Definir la estructura de las tablas.
 */

const schemaDefinitions = [
    // Tabla de usuarios con autenticación
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Índice único en email
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

    // Tabla de información personal
    `CREATE TABLE IF NOT EXISTS personal_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        postal_code TEXT,
        current_title TEXT,
        linkedin TEXT,
        portfolio TEXT,
        github TEXT,
        summary TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Tabla de experiencia laboral
    `CREATE TABLE IF NOT EXISTS experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        start_date TEXT,
        end_date TEXT,
        current BOOLEAN DEFAULT 0,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Tabla de educación
    `CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        degree TEXT NOT NULL,
        school TEXT NOT NULL,
        field_of_study TEXT,
        start_date TEXT,
        end_date TEXT,
        current BOOLEAN DEFAULT 0,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Tabla de habilidades
    `CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        level INTEGER DEFAULT 3,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
];

function runSchemaSetup(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            try {
                schemaDefinitions.forEach(sql => db.run(sql));
                console.log('✅ Esquema verificado/actualizado');
                resolve();
            } catch (err) {
                console.error('❌ Error en definición de esquema:', err);
                reject(err);
            }
        });
    });
}

module.exports = {
    runSchemaSetup
};
