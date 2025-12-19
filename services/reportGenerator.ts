
import { DailyRecord, Expense, Flock, Sale, Client } from '../types';

// Declaração para acessar o jsPDF carregado via CDN (UMD global)
declare const jspdf: any;

// Helper para formatação de moeda
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper para formatação de data
const formatDate = (date: string) => {
    if (!date) return '-';
    // Garante que a data seja interpretada corretamente independente do formato
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// Configuração de cores e estilos
const COLORS = {
    primary: [245, 158, 11], // Amber-500
    secondary: [251, 191, 36], // Amber-400
    accent: [255, 255, 255], // White
    textDark: [30, 41, 59], // Slate-800
    textLight: [100, 116, 139], // Slate-500
    success: [22, 163, 74], // Green
    danger: [220, 38, 38], // Red
    headerBg: [248, 250, 252] // Slate-50
};

const addHeader = (doc: any, title: string, subtitle: string) => {
    const pageWidth = doc.internal.pageSize.width;
    
    // Faixa Superior Colorida
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Título do App
    doc.setFontSize(24);
    doc.setTextColor(...COLORS.textDark);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartEgg', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestão Avícola', 14, 25);

    // Título do Relatório
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth - 14, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.textDark);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth - 14, 26, { align: 'right' });

    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, 32, pageWidth - 14, 32);
    
    return 40; // Retorna Y inicial para o conteúdo
};

const addFooter = (doc: any) => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const today = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.textLight);
        doc.text(`Gerado em: ${today}`, 14, pageHeight - 8);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
};

export const generateProductionReport = (
    records: DailyRecord[], 
    flocks: Flock[],
    expenses: Expense[],
    flockName: string,
    startDate: string,
    endDate: string
) => {
    // Inicializa jsPDF no modo padrão (Portrait/Retrato)
    const doc = new jspdf.jsPDF(); 
    
    const filterInfo = `Período: ${formatDate(startDate)} a ${formatDate(endDate)} | Filtro: ${flockName}`;
    let yPos = addHeader(doc, 'Relatório de Produção', filterInfo);

    // Cálculos de Resumo
    const totalEggs = records.reduce((sum, r) => sum + r.eggsCollected, 0);
    const totalBroken = records.reduce((sum, r) => sum + (r.brokenEggs || 0), 0);
    const totalGood = totalEggs - totalBroken;
    const totalMortality = records.reduce((sum, r) => sum + r.mortality, 0);
    const totalFeed = records.reduce((sum, r) => sum + r.feedConsumedKg, 0);
    
    // Cálculo das despesas totais do período
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Cálculos de custo por ovo
    const costPerEggExpenses = totalEggs > 0 ? totalExpenses / totalEggs : 0;
    const costPerEggFeed = totalEggs > 0 ? (totalFeed * 5) / totalEggs : 0; // Assuming R$5/kg feed price
    
    // Conversão Alimentar (gramas de ração por ovo produzido)
    // Formula: (Total Ração kg * 1000) / Total Ovos
    const feedConversion = totalEggs > 0 ? (totalFeed * 1000) / totalEggs : 0;
    
    const lossPercentage = totalEggs > 0 ? (totalBroken / totalEggs) * 100 : 0;
    const uniqueDays = new Set(records.map(r => r.date.split('T')[0])).size;
    const avgEggsPerDay = uniqueDays > 0 ? totalEggs / uniqueDays : 0;

    // --- Quadro de Resumo (Layout Vertical Otimizado) ---
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const boxHeight = 45; // Aumentado para caber 2 linhas de métricas

    doc.setFillColor(255, 251, 235); // Amber-50
    doc.setDrawColor(251, 191, 36); // Amber-400
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'FD');

    const drawMetric = (label: string, value: string, x: number, y: number, color: number[] = COLORS.textDark) => {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.textLight);
        doc.setFont('helvetica', 'normal');
        doc.text(label, x, y);
        
        doc.setFontSize(12);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(value, x, y + 6, { align: 'center' }); // Centraliza o valor no ponto X
        
        // Ajuste manual: recalculando o X do label para centralizar também
        const textWidth = doc.getTextWidth(label);
        doc.text(label, x - (textWidth / 2) + (doc.getTextWidth(value) / 2), y);
        // Nota: A lógica de alinhamento acima é simplificada.
        // Melhor abordagem: usar align: 'center' no método text se suportado ou calcular offset
    };
    
    // Função simplificada com alinhamento center nativo do jsPDF
    const drawCenteredMetric = (label: string, value: string, centerX: number, y: number, color: number[] = COLORS.textDark) => {
         doc.setFontSize(9);
         doc.setTextColor(...COLORS.textLight);
         doc.setFont('helvetica', 'normal');
         doc.text(label, centerX, y, { align: 'center' });

         doc.setFontSize(12);
         doc.setTextColor(...color);
         doc.setFont('helvetica', 'bold');
         doc.text(value, centerX, y + 6, { align: 'center' });
    };

    // Divide a largura em 3 colunas virtuais
    const colWidth = contentWidth / 3;
    const col1X = margin + (colWidth / 2);
    const col2X = margin + colWidth + (colWidth / 2);
    const col3X = margin + (colWidth * 2) + (colWidth / 2);
    
    const row1Y = yPos + 10;
    const row2Y = yPos + 28;

    // Linha 1
    drawCenteredMetric('Ovos Produzidos', totalEggs.toLocaleString('pt-BR'), col1X, row1Y);
    drawCenteredMetric('Média Diária', Math.round(avgEggsPerDay).toLocaleString('pt-BR'), col2X, row1Y);
    drawCenteredMetric('Perda (Quebrados)', `${totalBroken} (${lossPercentage.toFixed(1)}%)`, col3X, row1Y, COLORS.danger);

    // Linha 2 - CUSTOS DO OVO
    drawCenteredMetric('Custo/Ovo (Despesas)', formatCurrency(costPerEggExpenses), col1X, row2Y, COLORS.danger);
    drawCenteredMetric('Custo/Ovo (Ração)', formatCurrency(costPerEggFeed), col2X, row2Y, [251, 191, 36]); // Amber
    drawCenteredMetric('Conversão Alimentar', `${feedConversion.toFixed(1)} g/ovo`, col3X, row2Y, [37, 99, 235]); // Blue

    yPos += boxHeight + 10;

    // Agrupa registros por data e mostra cada lote em linha separada com cores
    const recordsByDate = records.reduce((acc: any, record) => {
        const date = record.date.split('T')[0]; // Pega apenas a data YYYY-MM-DD
        
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {});

    // Converte para array e ordena por data
    const sortedDates = Object.keys(recordsByDate).sort();

    // Cores para diferenciar lotes (com melhor contraste)
    const flockColors: { [key: string]: number[] } = {};
    const availableColors = [
        [59, 130, 246],   // Blue
        [34, 197, 94],    // Green
        [251, 146, 60],   // Orange
        [168, 85, 247],   // Purple
        [236, 72, 153],   // Pink
        [20, 184, 166],   // Teal
        [251, 191, 36],   // Amber
        [239, 68, 68]     // Red
    ];
    
    // Atribui cores aos lotes
    const uniqueFlocks = [...new Set(records.map(r => r.flockId))];
    uniqueFlocks.forEach((flockId, index) => {
        flockColors[flockId] = availableColors[index % availableColors.length];
    });

    // Tabela de Dados com cada lote em linha separada
    const tableData = [];
    
    sortedDates.forEach(date => {
        const dayRecords = recordsByDate[date];
        
        // Agrupa por lote dentro da data
        const recordsByFlock = dayRecords.reduce((flockAcc: any, record: any) => {
            if (!flockAcc[record.flockId]) {
                flockAcc[record.flockId] = {
                    flockId: record.flockId,
                    totalEggs: 0,
                    totalBroken: 0,
                    totalMortality: 0,
                    totalFeed: 0
                };
            }
            flockAcc[record.flockId].totalEggs += record.eggsCollected;
            flockAcc[record.flockId].totalBroken += (record.brokenEggs || 0);
            flockAcc[record.flockId].totalMortality += record.mortality;
            flockAcc[record.flockId].totalFeed += record.feedConsumedKg;
            return flockAcc;
        }, {});
        
        // Adiciona cada lote da data como linha separada
        Object.values(recordsByFlock).forEach((flockData: any) => {
            const flock = flocks.find(f => f.id === flockData.flockId);
            const flockName = flock ? flock.name : 'Desconhecido';
            const flockColor = flockColors[flockData.flockId];
            
            const dailyConversion = flockData.totalEggs > 0 ? (flockData.totalFeed * 1000) / flockData.totalEggs : 0;
            const dailyLoss = flockData.totalEggs > 0 ? (flockData.totalBroken / flockData.totalEggs) * 100 : 0;
            
            tableData.push([
                formatDate(date),
                flockName,
                flockData.totalEggs.toLocaleString('pt-BR'),
                flockData.totalBroken,
                `${dailyLoss.toFixed(1)}%`,
                flockData.totalFeed.toFixed(2),
                dailyConversion.toFixed(1),
                flockData.totalMortality,
                flockColor // Cor do lote para estilização
            ]);
        });
    });
    
    doc.autoTable({
        startY: yPos,
        // Cabeçalhos Completos e Descritivos
        head: [['Data', 'Lote', 'Ovos Coletados', 'Ovos Quebrados', '% Perda', 'Ração (kg)', 'Conversão', 'Mortalidade']],
        body: tableData.map(row => row.slice(0, 8)), // Remove a cor do body
        theme: 'grid', 
        headStyles: { 
            fillColor: COLORS.primary, 
            textColor: COLORS.accent, 
            fontStyle: 'bold',
            halign: 'center', // Cabeçalhos centralizados
            valign: 'middle',
            fontSize: 8 // Fonte ajustada para caber os títulos maiores
        },
        columnStyles: {
            0: { halign: 'center' }, // Data
            1: { halign: 'center' }, // Lote
            2: { halign: 'center' }, // Ovos
            3: { halign: 'center', textColor: COLORS.danger }, // Quebrados
            4: { halign: 'center' }, // % Perda
            5: { halign: 'center' }, // Ração
            6: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] }, // Conversão (Azul)
            7: { halign: 'center' }  // Mortalidade
        },
        styles: { 
            font: 'helvetica', 
            fontSize: 8, 
            cellPadding: 3,
            valign: 'middle'
        },
        // Aplica cores diferenciadas por lote
        didParseCell: (data: any) => {
            const rowIndex = data.row.index;
            const flockColor = tableData[rowIndex][8]; // Cor está na 9ª posição
            
            if (flockColor && data.section === 'body') {
                // Aplica cor de fundo MUITO suave na célula do lote
                if (data.column.index === 1) { // Coluna do lote
                    data.cell.styles.fillColor = [245, 245, 245]; // Fundo cinza muito claro
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = COLORS.textDark; // Texto escuro para melhor legibilidade
                }
            }
        },
        didDrawCell: (data: any) => {
            const rowIndex = data.row.index;
            const flockColor = tableData[rowIndex][8];
            
            if (flockColor && data.section === 'body' && data.column.index === 1) {
                // Desenha uma barra lateral colorida para identificar o lote
                const doc = data.doc;
                const cell = data.cell;
                doc.setFillColor(...flockColor);
                doc.rect(cell.x, cell.y, 3, cell.height, 'F'); // Barra um pouco mais larga
            }
        },
    });

    addFooter(doc);
    doc.save(`Producao_${endDate}.pdf`);
};

type ClientReportSummary = {
    client: Client;
    totalSpent: number;
    totalQuantity: number;
    saleCount: number;
    lastPurchase: string | null;
    avgTicket: number;
};

export const generateFinancialReport = (
    expenses: Expense[],
    sales: Sale[],
    clientSummaries: ClientReportSummary[] = [],
    flocks: Flock[],
    flockName: string,
    startDate: string,
    endDate: string
) => {
    const doc = new jspdf.jsPDF(); // Portrait (padrão)

    const filterInfo = `Período: ${formatDate(startDate)} a ${formatDate(endDate)} | Filtro: ${flockName}`;
    let yPos = addHeader(doc, 'Relatório Financeiro', filterInfo);

    // Cálculos DRE
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netResult = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;

    // Resumo Executivo (Estilo DRE)
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, yPos, 182, 45, 2, 2, 'FD');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.textDark);
    doc.text('Resumo do Período', 20, yPos + 10);

    const drawLineItem = (label: string, value: number, y: number, isTotal = false, isNegative = false) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
        doc.setTextColor(...COLORS.textDark);
        doc.text(label, 20, y);

        const color = isNegative ? COLORS.danger : (isTotal && value >= 0 ? COLORS.success : COLORS.textDark);
        doc.setTextColor(...color);
        doc.text(formatCurrency(value), 180, y, { align: 'right' });
    };

    drawLineItem('Receita Bruta (Vendas)', totalRevenue, yPos + 20);
    drawLineItem('(-) Despesas Operacionais', totalExpenses, yPos + 27, false, true);
    
    doc.setDrawColor(200);
    doc.line(20, yPos + 32, 180, yPos + 32);

    drawLineItem('(=) Resultado Líquido', netResult, yPos + 39, true);
    
    // Margem
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`Margem de Lucro: ${margin.toFixed(1)}%`, 20, yPos + 44);

    yPos += 55;

    // Seção de Receitas
    if (sales.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.success);
        doc.text('Detalhamento de Vendas', 14, yPos);
        yPos += 5;

        const salesData = sales.map(s => [
            formatDate(s.date),
            s.productType || 'Ovos',
            s.saleType,
            s.quantity,
            formatCurrency(s.pricePerUnit),
            formatCurrency(s.totalAmount)
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Data', 'Produto', 'Tipo', 'Qtd', 'Unit.', 'Total']],
            body: salesData,
            theme: 'grid',
            headStyles: { fillColor: COLORS.success, textColor: COLORS.accent },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' }
            },
            styles: { fontSize: 9 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Seção de Despesas
    if (expenses.length > 0) {
        // Verifica quebra de página
        if (yPos > doc.internal.pageSize.height - 40) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.danger);
        doc.text('Detalhamento de Despesas', 14, yPos);
        yPos += 5;

        const expensesData = expenses.map(e => [
            formatDate(e.date),
            flocks.find(f => f.id === e.flockId)?.name || 'Geral',
            e.category,
            e.description,
            formatCurrency(e.amount)
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Data', 'Lote', 'Categoria', 'Descrição', 'Valor']],
            body: expensesData,
            theme: 'grid',
            headStyles: { fillColor: COLORS.danger, textColor: COLORS.accent },
            columnStyles: {
                4: { halign: 'right', fontStyle: 'bold' }
            },
            styles: { fontSize: 9 }
        });
    }

    addFooter(doc);
    doc.save(`Financeiro_${endDate}.pdf`);
};
