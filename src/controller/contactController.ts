import { Request, Response } from 'express';
import { identifyAndConsolidate } from '../service/contactService';
import { IdentifyRequest } from '../models/contactModel';

export async function identifyContact(req: Request, res: Response): Promise<void> {
  try {
    // Extract request data
    const { email, phoneNumber } = req.body as IdentifyRequest;
    
    // Normalize phone number to string if it's a number
    const normalizedPhoneNumber = phoneNumber !== undefined && phoneNumber !== null 
      ? String(phoneNumber) 
      : null;
    
    const normalizedEmail = email !== undefined ? email : null;
    
    // Call the service to identify and consolidate contacts
    const result = await identifyAndConsolidate({
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber
    });
    
    // Return the response
    res.status(200).json(result);
  } catch (error) {
    console.error('Error identifying contact:', error);
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message === 'Either email or phoneNumber must be provided') {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    
    // Generic error response
    res.status(500).json({ error: 'An internal server error occurred' });
  }
}