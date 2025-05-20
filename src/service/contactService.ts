import { 
  findContactsByEmailOrPhone, 
  createContact,
  updateContactLinkage,
  findAllLinkedContacts,
  findPrimaryContact,
  findSecondaryContactsByPrimaryId
} from '../repository/contactRepository';
import { Contact, IdentifyRequest, IdentifyResponse } from '../models/contactModel';

export async function identifyAndConsolidate(request: IdentifyRequest): Promise<IdentifyResponse> {
  const { email, phoneNumber } = request;
  
  // Validate request - either email or phone must be provided
  if (!email && !phoneNumber) {
    throw new Error('Either email or phoneNumber must be provided');
  }

  // Find any existing contacts that match the email or phone
  const existingContacts = await findContactsByEmailOrPhone(email, phoneNumber);
  
  if (existingContacts.length === 0) {
    // No existing contacts - create a new primary contact
    const newContactId = await createContact(email, phoneNumber, null, 'primary');
    
    return {
      contact: {
        primaryContactId: newContactId,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: []
      }
    };
  }

  // Sort contacts by creation time (ascending)
  const sortedContacts = [...existingContacts].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Get all primary contacts from the sorted list
  const primaryContacts = sortedContacts.filter(contact => contact.linkPrecedence === 'primary');
  
  // If there are multiple primary contacts, we need to consolidate them
  let primaryContact: Contact;
  if (primaryContacts.length > 1) {
    // The oldest contact becomes the primary
    primaryContact = primaryContacts[0];
    
    // Convert other primaries to secondary and link them to the primary
    for (let i = 1; i < primaryContacts.length; i++) {
      await updateContactLinkage(primaryContacts[i].id, primaryContact.id, 'secondary');
    }
  } else {
    primaryContact = primaryContacts[0];
  }

  // Check if we need to create a new secondary contact
  const hasNewInformation = (
    (email && !existingContacts.some(c => c.email === email)) ||
    (phoneNumber && !existingContacts.some(c => c.phoneNumber === phoneNumber))
  );
  
  if (hasNewInformation) {
    await createContact(email, phoneNumber, primaryContact.id, 'secondary');
  }

  // Get all linked contacts for the consolidated response
  const allContactIds = existingContacts.map(contact => contact.id);
  const allLinkedContacts = await findAllLinkedContacts([...allContactIds, primaryContact.id]);
  
  // Fetch the most up-to-date primary contact
  const updatedPrimaryContact = await findPrimaryContact(primaryContact.id);
  if (!updatedPrimaryContact) {
    throw new Error('Primary contact not found');
  }
  
  // Get all secondary contacts
  const secondaryContacts = await findSecondaryContactsByPrimaryId(updatedPrimaryContact.id);
  
  // Consolidate emails and phone numbers
  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];
  
  // Add primary contact information first
  if (updatedPrimaryContact.email) emails.add(updatedPrimaryContact.email);
  if (updatedPrimaryContact.phoneNumber) phoneNumbers.add(updatedPrimaryContact.phoneNumber);
  
  // Add secondary contacts information
  for (const contact of secondaryContacts) {
    secondaryContactIds.push(contact.id);
    if (contact.email) emails.add(contact.email);
    if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
  }
  
  // Include the new information if it's not already in the list
  if (email && !emails.has(email)) emails.add(email);
  if (phoneNumber && !phoneNumbers.has(phoneNumber)) phoneNumbers.add(phoneNumber);
  
  return {
    contact: {
      primaryContactId: updatedPrimaryContact.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds
    }
  };
}