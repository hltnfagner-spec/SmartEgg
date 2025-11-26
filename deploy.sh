#!/bin/bash

# Script de Deploy para Vercel - SmartEgg

echo "🚀 Preparando SmartEgg para deploy na Vercel..."

# Verificar se há mudanças não commitadas
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Commitando mudanças..."
    git add .
    git commit -m "🚀 Preparando deploy: $(date)"
else
    echo "✅ Nenhuma mudança para commitar"
fi

# Push para GitHub
echo "📤 Enviando para GitHub..."
git push origin main

echo "✅ Deploy iniciado! Acesse sua dashboard Vercel para acompanhar."
echo "🌐 URL: https://vercel.com/dashboard"
echo ""
echo "⚠️  Lembre-se de configurar as variáveis de ambiente na Vercel:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_GEMINI_API_KEY (opcional)"
