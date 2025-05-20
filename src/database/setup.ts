import pool from './db';

export async function setupDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // Create Contact table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Contact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phoneNumber VARCHAR(20),
        email VARCHAR(255),
        linkedId INT,
        linkPrecedence ENUM('primary', 'secondary') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_phone (phoneNumber),
        INDEX idx_linkedId (linkedId)
      )
    `);
    
    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}