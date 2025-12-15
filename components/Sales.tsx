import { useState, useEffect, FC, ChangeEvent, FormEvent, FocusEvent, useRef } from 'react';
import { useFarm } from '../context/FarmContext';
import { Sale, SaleType, PaymentMethod, PaymentStatus, ProductType, DeliveryStatus, CompanySettings } from '../types';
import { EditIcon, PrinterIcon, DownloadIcon } from './icons';
import html2pdf from 'html2pdf.js';

const SALE_TYPES: SaleType[] = ['Cliente Final', 'Atacado'];
const PRODUCT_TYPES: ProductType[] = ['Ovos', 'Aves', 'Cama'];
const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'Pix', 'Cartão Crédito', 'Cartão Débito', 'Transferência', 'Boleto'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Pago', 'Pendente'];
const DELIVERY_STATUSES: DeliveryStatus[] = ['Pendente', 'Em Rota', 'Entregue', 'Cancelada'];

const AddSaleForm: FC<{onClose: () => void; saleToEdit?: Sale | null}> = ({ onClose, saleToEdit }) => {
    const { addSale, updateSale, flocks, clients } = useFarm();
    
    // Helper para formatar data para input
    const formatDateForInput = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - offset)).toISOString().split('T')[0];
    };

    // Usando 'any' para facilitar o manuseio de formulário complexo
    const [formData, setFormData] = useState<any>({
        date: formatDateForInput(new Date()),
        flockId: flocks.length > 0 ? flocks[0].id : '',
        clientId: '',
        productType: 'Ovos',
        saleType: 'Cliente Final',
        paymentMethod: 'Dinheiro',
        paymentStatus: 'Pago',
        quantity: 0,
        pricePerUnit: 0,
        // Campos de entrega
        hasDelivery: false,
        deliveryDate: formatDateForInput(new Date()),
        deliveryStatus: 'Entregue',
        deliveryAddress: '',
        deliveryNotes: ''
    });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (saleToEdit) {
            setFormData({
                ...saleToEdit,
                productType: saleToEdit.productType || 'Ovos',
                date: formatDateForInput(new Date(saleToEdit.date)),
                // Lógica para preencher dados de entrega existentes ou padrão
                hasDelivery: !!saleToEdit.deliveryAddress || (saleToEdit.deliveryStatus && saleToEdit.deliveryStatus !== 'Entregue'),
                deliveryDate: saleToEdit.deliveryDate ? formatDateForInput(new Date(saleToEdit.deliveryDate)) : formatDateForInput(new Date(saleToEdit.date)),
                deliveryStatus: saleToEdit.deliveryStatus || 'Entregue',
                deliveryAddress: saleToEdit.deliveryAddress || '',
                deliveryNotes: saleToEdit.deliveryNotes || ''
            });
            setTotal(saleToEdit.totalAmount);
        }
    }, [saleToEdit]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const type = e.target.type;
        
        let val: string | number | boolean = value;
        
        if (type === 'checkbox') {
             val = (e.target as HTMLInputElement).checked;
             // Se desmarcar entrega, reseta status para entregue (assumindo retirada no local)
             if (name === 'hasDelivery' && val === false) {
                 setFormData((prev: any) => ({...prev, deliveryStatus: 'Entregue'}));
             } else if (name === 'hasDelivery' && val === true) {
                 setFormData((prev: any) => ({...prev, deliveryStatus: 'Pendente'}));
             }
        } else if (name === 'quantity' || name === 'pricePerUnit') {
            val = value === '' ? '' : parseFloat(value);
        }

        let newFormData = {
            ...formData,
            [name]: val
        };

        // Special handling for client selection to auto-update Sale Type and Address
        if (name === 'clientId') {
            const selectedClient = clients.find(c => c.id === value);
            if (selectedClient) {
                newFormData.saleType = selectedClient.type === 'Atacado' ? 'Atacado' : 'Cliente Final';
                // Auto-fill address if delivery is enabled or if address field is empty
                if (newFormData.hasDelivery || !newFormData.deliveryAddress) {
                    newFormData.deliveryAddress = selectedClient.address;
                }
            }
        }

        setFormData(newFormData);
        
        const q = Number(newFormData.quantity) || 0;
        const p = Number(newFormData.pricePerUnit) || 0;
        setTotal(q * p);
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setFormData((prev: any) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const q = Number(formData.quantity);
        const p = Number(formData.pricePerUnit);

        if (!formData.flockId || q <= 0 || p <= 0) {
            alert("Por favor, preencha todos os campos com valores válidos.");
            return;
        }
        
        // Prepara payload
        const payload: any = {
            date: new Date(formData.date).toISOString(),
            flockId: formData.flockId,
            clientId: formData.clientId || undefined,
            productType: formData.productType,
            saleType: formData.saleType,
            paymentMethod: formData.paymentMethod,
            paymentStatus: formData.paymentStatus,
            quantity: q,
            pricePerUnit: p,
        };

        // Adiciona dados de entrega se "Agendar Entrega" estiver marcado
        if (formData.hasDelivery) {
            payload.deliveryDate = new Date(formData.deliveryDate).toISOString();
            payload.deliveryStatus = formData.deliveryStatus;
            payload.deliveryAddress = formData.deliveryAddress;
            payload.deliveryNotes = formData.deliveryNotes;
        } else {
            // Se não for entrega agendada, salvamos status 'Entregue' e data da venda
            payload.deliveryDate = new Date(formData.date).toISOString();
            payload.deliveryStatus = 'Entregue';
            payload.deliveryAddress = ''; // Retirada no local
            payload.deliveryNotes = '';
        }
        
        if (saleToEdit) {
            updateSale(saleToEdit.id, payload);
        } else {
            addSale(payload);
        }
        
        onClose();
    };

    const selectedClientType = clients.find(c => c.id === formData.clientId)?.type;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção Dados da Venda */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide border-b border-stone-200 pb-1">Dados da Venda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-stone-600">Data da Venda</label>
                        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label htmlFor="flockId" className="block text-sm font-medium text-stone-600">Lote Origem</label>
                        <select id="flockId" name="flockId" value={formData.flockId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                            <option value="">Selecione um lote</option>
                            {flocks.map(flock => <option key={flock.id} value={flock.id}>{flock.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="clientId" className="block text-sm font-medium text-stone-600">Cliente</label>
                        <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                            <option value="">Venda Avulsa (Sem cliente)</option>
                            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                        </select>
                        {selectedClientType && (
                            <p className="text-xs text-stone-500 mt-1">
                                Tipo: <span className={`font-medium ${selectedClientType === 'Atacado' ? 'text-purple-600' : 'text-blue-600'}`}>{selectedClientType}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="productType" className="block text-sm font-medium text-stone-600">Produto</label>
                        <select id="productType" name="productType" value={formData.productType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                            {PRODUCT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="saleType" className="block text-sm font-medium text-stone-600">Tipo Venda</label>
                        <select id="saleType" name="saleType" value={formData.saleType} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                            {SALE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-stone-600">Quantidade</label>
                        <input type="number" id="quantity" name="quantity" min="0" value={formData.quantity} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label htmlFor="pricePerUnit" className="block text-sm font-medium text-stone-600">Preço Unitário (R$)</label>
                        <input type="number" step="0.01" id="pricePerUnit" name="pricePerUnit" min="0" value={formData.pricePerUnit} onChange={handleChange} onFocus={handleFocus} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                </div>
            </div>

            {/* Seção Agendamento e Logística */}
            <div className="space-y-4 bg-stone-50 p-4 rounded-lg border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2">
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide">Agendamento de Entrega</h3>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="hasDelivery" 
                            checked={formData.hasDelivery} 
                            onChange={handleChange} 
                            className="form-checkbox h-4 w-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-stone-700">Agendar Entrega?</span>
                    </label>
                </div>

                {formData.hasDelivery && (
                    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="deliveryDate" className="block text-sm font-medium text-stone-600">Data da Entrega</label>
                                <input type="date" id="deliveryDate" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div>
                                <label htmlFor="deliveryStatus" className="block text-sm font-medium text-stone-600">Status Inicial</label>
                                <select id="deliveryStatus" name="deliveryStatus" value={formData.deliveryStatus} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                                    {DELIVERY_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="deliveryAddress" className="block text-sm font-medium text-stone-600">Endereço de Entrega</label>
                            <input type="text" id="deliveryAddress" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} placeholder="Rua, Número, Bairro, Cidade" className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                         <div>
                            <label htmlFor="deliveryNotes" className="block text-sm font-medium text-stone-600">Observações de Entrega</label>
                            <input type="text" id="deliveryNotes" name="deliveryNotes" value={formData.deliveryNotes} onChange={handleChange} placeholder="Ex: Deixar na portaria, cuidado frágil" className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                    </div>
                )}
            </div>

            {/* Seção Pagamento */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide border-b border-stone-200 pb-1">Pagamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-stone-600">Forma de Pagamento</label>
                        <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                            {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="paymentStatus" className="block text-sm font-medium text-stone-600">Situação</label>
                        <select id="paymentStatus" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500">
                            {PAYMENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                </div>
                <div className="bg-stone-50 p-3 rounded-md text-center mt-2">
                    <p className="text-sm font-medium text-stone-600">Total da Venda</p>
                    <p className="text-2xl font-bold text-green-600">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-stone-100">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 border border-stone-300 rounded-md hover:bg-stone-200">Cancelar</button>
                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm">{saleToEdit ? 'Salvar Alterações' : 'Registrar Venda'}</button>
            </div>
        </form>
    );
};


// Componente de Recibo para Impressão
const SaleReceipt: FC<{ sale: Sale; client?: any; settings: CompanySettings | null; onClose: () => void }> = ({ sale, client, settings, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Pedido de Venda #${sale.saleNumber || 'N/A'}</title>
                    <style>
                        @page { size: A4; margin: 15mm; }
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px; 
                            background: white;
                            color: #000;
                            font-size: 14px;
                        }
                        table {
                            border-collapse: collapse;
                        }
                        @media print { 
                            body { padding: 15mm; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownloadPDF = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        // Criar nome do arquivo
        const fileName = `Pedido_${String(sale.saleNumber || 0).padStart(3, '0')}_${client?.name?.replace(/\s+/g, '_') || 'Cliente'}`;

        // Configurações do PDF
        const opt = {
            margin: 10,
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                allowTaint: true,
                logging: false,
                letterRendering: true
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        // Gerar e baixar o PDF diretamente
        html2pdf().set(opt).from(printContent).save();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-stone-800">Pedido de Venda</h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-700">✕</button>
                </div>
                
                {/* Preview do Recibo */}
                <div ref={receiptRef} className="p-6 bg-white overflow-y-auto flex-1" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                    {/* Cabeçalho com Logo e Dados da Granja */}
                    <table style={{ width: '100%', border: '2px solid #999', marginBottom: '6px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '160px', padding: '8px', verticalAlign: 'top', borderRight: '1px solid #999' }}>
                                    {settings?.logo ? (
                                        <img src={settings.logo} alt="Logo" style={{ maxWidth: '150px', maxHeight: '80px' }} />
                                    ) : (
                                        <div style={{ width: '150px', height: '80px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#999' }}>
                                            Logo
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '8px', verticalAlign: 'top', fontSize: '11px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>{settings?.farmName || 'Granja'}</div>
                                            {settings?.document && <div style={{ fontSize: '11px' }}>CNPJ: {settings.document}</div>}
                                            {settings?.address && <div style={{ fontSize: '11px' }}>{settings.address}</div>}
                                            {settings?.city && settings?.state && settings?.zipCode && (
                                                <div style={{ fontSize: '11px' }}>{settings.city}/{settings.state} - CEP: {settings.zipCode}</div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '11px' }}>
                                            {settings?.phone && <div>{settings.phone}</div>}
                                            {settings?.email && <div>{settings.email}</div>}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Pedido Nº e Data */}
                    <table style={{ width: '100%', marginBottom: '6px' }}>
                        <tbody>
                            <tr style={{ background: '#ccc' }}>
                                <td style={{ padding: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                                    PEDIDO Nº {String(sale.saleNumber || 0).padStart(3, '0')}
                                </td>
                                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                                    {new Date(sale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Dados do Cliente */}
                    <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse', marginBottom: '6px' }}>
                        <thead>
                            <tr style={{ background: '#ccc' }}>
                                <th colSpan={4} style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #999', fontSize: '12px' }}>
                                    DADOS DO CLIENTE
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', width: '15%', fontSize: '11px' }}>Nome</td>
                                <td style={{ padding: '4px', border: '1px solid #999', width: '35%', fontSize: '11px' }}>{client?.name || 'Venda Avulsa'}</td>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', width: '15%', fontSize: '11px' }}>Telefone</td>
                                <td style={{ padding: '4px', border: '1px solid #999', width: '35%', fontSize: '11px' }}>{client?.phone || ''}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', fontSize: '11px' }}>CPF/CNPJ</td>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{client?.document || ''}</td>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', fontSize: '11px' }}>E-mail</td>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{client?.email || ''}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', fontSize: '11px' }}>Endereço</td>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{client?.address || ''}</td>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', fontSize: '11px' }}>Cidade</td>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{client?.city || ''}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', fontSize: '11px' }}>Bairro</td>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{client?.neighborhood || ''}</td>
                                <td style={{ padding: '4px', fontWeight: 'bold', border: '1px solid #999', fontSize: '11px' }}>UF</td>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{client?.state || ''}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Produtos */}
                    <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse', marginBottom: '6px' }}>
                        <thead>
                            <tr style={{ background: '#ccc' }}>
                                <th colSpan={4} style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #999', fontSize: '12px' }}>
                                    PRODUTOS
                                </th>
                            </tr>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ padding: '4px', border: '1px solid #999', textAlign: 'left', fontSize: '11px' }}>Descrição</th>
                                <th style={{ padding: '4px', border: '1px solid #999', textAlign: 'center', width: '15%', fontSize: '11px' }}>Quantidade</th>
                                <th style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', width: '20%', fontSize: '11px' }}>Preço unitário</th>
                                <th style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', width: '20%', fontSize: '11px' }}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>{sale.productType}</td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'center', fontSize: '11px' }}>{sale.quantity}</td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', fontSize: '11px' }}>
                                    {sale.pricePerUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>
                                    {sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Dados do Pagamento */}
                    <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse', marginBottom: '6px' }}>
                        <thead>
                            <tr style={{ background: '#ccc' }}>
                                <th colSpan={4} style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #999', fontSize: '12px' }}>
                                    Dados do pagamento
                                </th>
                            </tr>
                            <tr style={{ background: '#f0f0f0' }}>
                                <th style={{ padding: '4px', border: '1px solid #999', width: '15%', fontSize: '11px' }}>Parcela</th>
                                <th style={{ padding: '4px', border: '1px solid #999', width: '25%', fontSize: '11px' }}>Vencimento</th>
                                <th style={{ padding: '4px', border: '1px solid #999', fontSize: '11px' }}>Forma de Pagamento</th>
                                <th style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', width: '20%', fontSize: '11px' }}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'center', fontSize: '11px' }}>1</td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'center', fontSize: '11px' }}>
                                    {new Date(sale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'center', fontSize: '11px' }}>{sale.paymentMethod}</td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>
                                    {sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ padding: '4px', border: '1px solid #999', fontWeight: 'bold', textAlign: 'right', fontSize: '11px' }}>Total</td>
                                <td style={{ padding: '4px', border: '1px solid #999', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>
                                    {sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Status do Pagamento - Destacado */}
                    <div style={{ 
                        margin: '8px 0', 
                        padding: '12px', 
                        textAlign: 'center',
                        border: '3px solid ' + (sale.paymentStatus === 'Pago' ? '#10b981' : '#f59e0b'),
                        background: sale.paymentStatus === 'Pago' ? '#d1fae5' : '#fef3c7',
                        borderRadius: '6px'
                    }}>
                        <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold',
                            color: sale.paymentStatus === 'Pago' ? '#065f46' : '#92400e',
                            letterSpacing: '1px'
                        }}>
                            {sale.paymentStatus === 'Pago' ? '✓ PAGAMENTO REALIZADO' : '⚠ PAGAMENTO PENDENTE'}
                        </div>
                    </div>

                    {/* Assinatura do Cliente */}
                    <table style={{ width: '100%', border: '1px solid #999', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#ccc' }}>
                                <th style={{ padding: '5px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #999', fontSize: '12px' }}>
                                    Assinatura do cliente
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '50px 20px', border: '1px solid #999', position: 'relative' }}>
                                    <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', borderTop: '2px solid #000', width: '60%', paddingTop: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                                        {client?.name || 'Cliente'}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Botões */}
                <div className="p-4 border-t flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200">
                        Fechar
                    </button>
                    <button onClick={handleDownloadPDF} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center">
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Baixar PDF
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 flex items-center">
                        <PrinterIcon className="w-4 h-4 mr-2" />
                        Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

const Sales: FC = () => {
    const { sales, getFlockById, getClientById, companySettings, loadCompanySettings } = useFarm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
    const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
    
    // Recarregar configurações sempre que abrir o recibo
    useEffect(() => {
        if (receiptSale) {
            loadCompanySettings();
        }
    }, [receiptSale, loadCompanySettings]);

    const handleOpenEditModal = (sale: Sale) => {
        setSaleToEdit(sale);
        setIsModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setSaleToEdit(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSaleToEdit(null);
    };

    const handleOpenReceipt = (sale: Sale) => {
        setReceiptSale(sale);
    };

    const handleCloseReceipt = () => {
        setReceiptSale(null);
    };

    const getDeliveryBadge = (status?: DeliveryStatus) => {
        switch(status) {
            case 'Pendente': return 'bg-yellow-100 text-yellow-800';
            case 'Em Rota': return 'bg-blue-100 text-blue-800';
            case 'Entregue': return 'bg-green-100 text-green-800';
            case 'Cancelada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-stone-800">Gerenciamento de Vendas</h1>
                <button onClick={handleOpenAddModal} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-colors">
                    Adicionar Venda
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-stone-500 min-w-[1000px]">
                        <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Nº Venda</th>
                                <th scope="col" className="px-4 py-3">Data</th>
                                <th scope="col" className="px-4 py-3">Produto</th>
                                <th scope="col" className="px-4 py-3">Cliente</th>
                                <th scope="col" className="px-4 py-3">Status Entrega</th>
                                <th scope="col" className="px-4 py-3">Status Pagto.</th>
                                <th scope="col" className="px-4 py-3 text-right">Qtd</th>
                                <th scope="col" className="px-4 py-3 text-right">Total</th>
                                <th scope="col" className="px-4 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length > 0 ? sales.map(sale => (
                                <tr key={sale.id} className="bg-white border-b hover:bg-stone-50 group">
                                    <td className="px-4 py-4">
                                        <span className="font-mono font-bold text-amber-700">#{String(sale.saleNumber || 0).padStart(6, '0')}</span>
                                    </td>
                                    <td className="px-4 py-4">{new Date(sale.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                    <td className="px-4 py-4 font-medium text-amber-600">{sale.productType || 'Ovos'}</td>
                                    <td className="px-4 py-4 font-medium text-stone-800">
                                        {sale.clientId ? (getClientById(sale.clientId)?.name || 'Cliente Excluído') : 'Venda Avulsa'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryBadge(sale.deliveryStatus)}`}>
                                            {sale.deliveryStatus || 'Entregue'}
                                        </span>
                                        {sale.deliveryStatus === 'Pendente' && sale.deliveryDate && (
                                            <div className="text-[10px] text-stone-500 mt-1">
                                                Prev: {new Date(sale.deliveryDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.paymentStatus === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {sale.paymentStatus || 'Pago'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">{sale.quantity}</td>
                                    <td className="px-4 py-4 text-right font-medium text-green-600">
                                        {sale.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <button onClick={() => handleOpenReceipt(sale)} className="p-2 text-stone-500 hover:text-green-600 transition-colors" aria-label="Imprimir Recibo" title="Imprimir Recibo">
                                                <PrinterIcon />
                                            </button>
                                            <button onClick={() => handleOpenEditModal(sale)} className="p-2 text-stone-500 hover:text-amber-600 transition-colors" aria-label="Editar Venda" title="Editar Venda">
                                                <EditIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-10 text-stone-500">Nenhuma venda registrada ainda.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl relative">
                            <h2 className="text-2xl font-bold text-stone-800 mb-4">{saleToEdit ? 'Editar Venda' : 'Nova Venda'}</h2>
                            <AddSaleForm onClose={handleCloseModal} saleToEdit={saleToEdit} />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Recibo */}
            {receiptSale && (
                <SaleReceipt 
                    sale={receiptSale} 
                    client={receiptSale.clientId ? getClientById(receiptSale.clientId) : undefined}
                    settings={companySettings}
                    onClose={handleCloseReceipt}
                />
            )}
        </div>
    );
};

export default Sales;
