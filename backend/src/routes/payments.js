import express from 'express';
import { z } from 'zod';
import { supabase } from '../db/supabase.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Resend } from 'resend';
import generateEmail from '../templates/email.js';
import { generateQRCode } from '../utils/qrcode.js';

const router = express.Router();

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);
const resend = new Resend(process.env.RESEND_API_KEY);

// Rota para criar pagamento
router.post('/', async (req, res, next) => {
    try {
        console.log('Criando preferência com body:', req.body);
        const { cardId, plan } = z.object({
            cardId: z.string().uuid(),
            plan: z.enum(['para_sempre', 'anual']),
        }).parse(req.body);

        const { data: card, error } = await supabase
            .from('cards')
            .select('id')
            .eq('id', cardId)
            .single();

        if (error || !card) {
            console.log('Cartão não encontrado:', cardId);
            return res.status(404).json({ error: 'Cartão não encontrado' });
        }

        const response = await preference.create({
            body: {
                items: [
                    {
                        title: `Cartão AgradeceAí - ${plan}`,
                        unit_price: plan === 'para_sempre' ? 17.99 : 8.99,
                        quantity: 1,
                    },
                ],
                back_urls: {
                    success: 'https://agradeceai.com/success',
                    failure: 'https://agradeceai.com/failure',
                    pending: 'https://agradeceai.com/pending',
                },
                notification_url: 'https://1234-5678.ngrok-free.app/webhooks/payments',
                external_reference: cardId,
            },
        });

        console.log('Preferência criada, ID:', response.id);
        res.json({ paymentUrl: response.init_point });
    } catch (error) {
        console.error('Erro ao criar preferência:', error.response?.data || error.message);
        next(error);
    }
});

// Rota para webhook
router.post('/webhooks/payments', async (req, res) => {
    try {
        const { id, topic } = req.body;
        if (topic !== 'payment') return res.status(200).json({ received: true });

        const { data: processed } = await supabase
            .from('processed_webhooks')
            .select('id')
            .eq('payment_id', id)
            .single();
        
        if (processed) return res.status(200).json({ received: true });
        
        const payment = await new Payment(client).get({ id });
        const cardId = payment.external_reference;
        const status = payment.status;
        
        if (status === 'approved') {
            // Atualiza status do pagamento
            const { error: updateError } = await supabase
                .from('cards')
                .update({ status_pagamento: 'aprovado' })
                .eq('id', cardId);
            
            if (updateError) throw new Error(updateError.message);
            
            // Gera QR Code
            const { data: card } = await supabase
                .from('cards')
                .select('url, email, conteudo, token_edit, plano')
                .eq('id', cardId)
                .single();
            
            const qrcode_url = await generateQRCode(cardId, card.url);
            await supabase
                .from('cards')
                .update({ qrcode_url })
                .eq('id', cardId);
            
            // Envia e-mail
            try {
                await resend.emails.send({
                    from: 'AgradeceAí <onboarding@resend.dev>',
                    to: card.email,
                    subject: 'Seu cartão AgradeceAí está pronto!',
                    html: generateEmail({
                        url: card.url,
                        qrcode_url: qrcode_url,
                        token_edit: card.token_edit,
                        pageName: card.conteudo.pageName,
                        plan: card.plano
                    })
                });
            } catch (emailError) {
                await supabase.from('failed_emails').insert({
                    card_id: cardId,
                    email: card.email,
                    payload: {
                        url: card.url,
                        qrcode_url: qrcode_url,
                        token_edit: card.token_edit,
                        pageName: card.conteudo.pageName,
                        plan: card.plano
                    }
                });
            }
            
            await supabase.from('processed_webhooks').insert({ payment_id: id });
        }
        
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(200).json({ received: true });
    }
});

export default router;