import pool from '../database/db';
import { Contact, IdentifyRequest } from '../models/contactModel';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export async function findContactsByEmailOrPhone(
  email: string | null | undefined, 
  phoneNumber: string | null | undefined
): Promise<Contact[]> {
  if (!email && !phoneNumber) {
    return [];
  }

  let query = 'SELECT * FROM Contact WHERE ';
  const params: any[] = [];
  
  if (email && phoneNumber) {
    query += '(email = ? OR phoneNumber = ?)';
    params.push(email, phoneNumber);
  } else if (email) {
    query += 'email = ?';
    params.push(email);
  } else {
    query += 'phoneNumber = ?';
    params.push(phoneNumber);
  }
  
  query += ' AND deletedAt IS NULL ORDER BY createdAt ASC';
  
  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows as Contact[];
}

export async function createContact(
  email: string | null | undefined,
  phoneNumber: string | null | undefined,
  linkedId: number | null,
  linkPrecedence: 'primary' | 'secondary'
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence) VALUES (?, ?, ?, ?)',
    [email || null, phoneNumber || null, linkedId, linkPrecedence]
  );
  
  return result.insertId;
}

export async function updateContactLinkage(
  contactId: number,
  linkedId: number,
  linkPrecedence: 'primary' | 'secondary'
): Promise<void> {
  await pool.query(
    'UPDATE Contact SET linkedId = ?, linkPrecedence = ? WHERE id = ?',
    [linkedId, linkPrecedence, contactId]
  );
}

export async function findAllLinkedContacts(contactIds: number[]): Promise<Contact[]> {
  if (contactIds.length === 0) {
    return [];
  }
  
  const placeholders = contactIds.map(() => '?').join(',');
  const query = `
    SELECT * FROM Contact 
    WHERE (id IN (${placeholders}) OR linkedId IN (${placeholders})) 
    AND deletedAt IS NULL 
    ORDER BY createdAt ASC
  `;
  
  const params = [...contactIds, ...contactIds];
  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows as Contact[];
}

export async function findPrimaryContact(contactId: number): Promise<Contact | null> {
  const [contacts] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM Contact WHERE id = ? AND linkPrecedence = "primary" AND deletedAt IS NULL',
    [contactId]
  );
  
  if (contacts.length === 0) {
    return null;
  }
  
  return contacts[0] as Contact;
}

export async function findSecondaryContactsByPrimaryId(primaryId: number): Promise<Contact[]> {
  const [contacts] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM Contact WHERE linkedId = ? AND linkPrecedence = "secondary" AND deletedAt IS NULL',
    [primaryId]
  );
  
  return contacts as Contact[];
}