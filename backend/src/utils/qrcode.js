import QRCode from 'qrcode';
import { supabase } from '../db/supabase.js';

export async function generateQRCode(cardId, url) {
  const fileName = `${cardId}.png`;
  const qrBuffer = await QRCode.toBuffer(url, { width: 200 });
  
  const { data, error } = await supabase.storage
    .from('qrcodes')
    .upload(fileName, qrBuffer, { contentType: 'image/png' });
  
  if (error) throw new Error(error.message);
  
  const publicUrl = supabase.storage.from('qrcodes').getPublicUrl(fileName).data.publicUrl;
  return publicUrl;
}