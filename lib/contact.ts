const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactInput = {
  name: string;
  contact: string;
  subject: string;
  message: string;
};

export function parseContact(input: ContactInput) {
  const name = input.name.trim();
  const contact = input.contact.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (name.length < 2 || name.length > 80) return null;
  if (subject.length < 2 || subject.length > 120) return null;
  if (message.length < 8 || message.length > 2000) return null;
  if (!isEmailOrPhone(contact)) return null;
  return { name, contact, subject, message };
}

function isEmailOrPhone(value: string) {
  if (EMAIL.test(value)) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && /^[+\d\s()-]+$/.test(value);
}
