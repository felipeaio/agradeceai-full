export default function generateEmail({ url, qrcode_url, token_edit, pageName, plan }) {
    return `
      <html>
        <body style="font-family: Arial; text-align: center;">
          <h1>Seu cartão AgradeceAí está pronto, ${pageName}!</h1>
          <p>Plano: ${plan === 'para_sempre' ? 'Para Sempre' : 'Anual'}</p>
          <img src="${qrcode_url}" alt="QR Code" style="width: 200px;" />
          <p><a href="${url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">Ver Cartão</a></p>
          <p><a href="https://agradeceai.com/edit/${token_edit}">Editar Cartão</a></p>
          <p>Compartilhe via <a href="https://wa.me/?text=Veja%20meu%20cartão:%20${url}">WhatsApp</a></p>
        </body>
      </html>
    `;
}