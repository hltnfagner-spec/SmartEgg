
import { useState, FC, ChangeEvent, FormEvent, useEffect } from 'react';
import { CompanySettings } from '../types';
import { useFarm } from '../context/FarmContext';

// Função para gerar UUID compatível com todos os navegadores
const generateId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const defaultSettings: CompanySettings = {
    id: '',
    farmName: '',
    ownerName: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    logo: ''
};

const Settings: FC = () => {
    const { companySettings, saveCompanySettings, loadCompanySettings } = useFarm();
    const [settings, setSettings] = useState<CompanySettings>(() => {
        try {
            const saved = localStorage.getItem('farm_settings');
            if (saved) {
                return JSON.parse(saved);
            }
            return { ...defaultSettings, id: generateId() };
        } catch {
            return { ...defaultSettings, id: generateId() };
        }
    });

    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Load settings from Supabase on component mount
    useEffect(() => {
        loadCompanySettings();
    }, [loadCompanySettings]);

    // Update local state when companySettings changes
    useEffect(() => {
        if (companySettings) {
            setSettings(companySettings);
        }
    }, [companySettings]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const formatDocument = (value: string) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');
        
        if (numbers.length <= 11) {
            // CPF: 000.000.000-00
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ: 00.000.000/0000-00
            return numbers
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    const formatZipCode = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    };

    const handleDocumentChange = (e: ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDocument(e.target.value);
        setSettings(prev => ({ ...prev, document: formatted }));
    };

    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setSettings(prev => ({ ...prev, phone: formatted }));
    };

    const handleZipCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const formatted = formatZipCode(e.target.value);
        setSettings(prev => ({ ...prev, zipCode: formatted }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!settings.farmName.trim()) {
            setMessage({ type: 'error', text: 'O nome da granja é obrigatório.' });
            return;
        }

        try {
            await saveCompanySettings(settings);
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações. Tente novamente.' });
        }
        
        setTimeout(() => setMessage(null), 3000);
    };

    const STATES = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-stone-800">Configurações</h1>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
                {/* Dados da Granja */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-stone-700 border-b border-stone-200 pb-2">
                        🏠 Dados da Granja
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="farmName" className="block text-sm font-medium text-stone-600">
                                Nome da Granja *
                            </label>
                            <input
                                type="text"
                                id="farmName"
                                name="farmName"
                                value={settings.farmName}
                                onChange={handleChange}
                                placeholder="Ex: Granja São José"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="ownerName" className="block text-sm font-medium text-stone-600">
                                Nome do Proprietário
                            </label>
                            <input
                                type="text"
                                id="ownerName"
                                name="ownerName"
                                value={settings.ownerName}
                                onChange={handleChange}
                                placeholder="Ex: João da Silva"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="document" className="block text-sm font-medium text-stone-600">
                                CPF / CNPJ
                            </label>
                            <input
                                type="text"
                                id="document"
                                name="document"
                                value={settings.document}
                                onChange={handleDocumentChange}
                                placeholder="000.000.000-00"
                                maxLength={18}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-stone-700 border-b border-stone-200 pb-2">
                        📞 Contato
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-stone-600">
                                Telefone
                            </label>
                            <input
                                type="text"
                                id="phone"
                                name="phone"
                                value={settings.phone}
                                onChange={handlePhoneChange}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-stone-600">
                                E-mail
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={settings.email}
                                onChange={handleChange}
                                placeholder="contato@granja.com"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-stone-700 border-b border-stone-200 pb-2">
                        📍 Endereço
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-stone-600">
                                Endereço
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                placeholder="Rua, número, bairro"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-stone-600">
                                Cidade
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={settings.city}
                                onChange={handleChange}
                                placeholder="Ex: São Paulo"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-stone-600">
                                    Estado
                                </label>
                                <select
                                    id="state"
                                    name="state"
                                    value={settings.state}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">UF</option>
                                    {STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="zipCode" className="block text-sm font-medium text-stone-600">
                                    CEP
                                </label>
                                <input
                                    type="text"
                                    id="zipCode"
                                    name="zipCode"
                                    value={settings.zipCode}
                                    onChange={handleZipCodeChange}
                                    placeholder="00000-000"
                                    maxLength={9}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão Salvar */}
                <div className="flex justify-end pt-4 border-t border-stone-200">
                    <button
                        type="submit"
                        className="px-6 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-sm transition-colors"
                    >
                        Salvar Configurações
                    </button>
                </div>
            </form>

            {/* Preview do Recibo */}
            {settings.farmName && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-stone-700 mb-4">
                        👁️ Pré-visualização do Cabeçalho do Recibo
                    </h2>
                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
                        <h3 className="text-xl font-bold text-stone-800">{settings.farmName}</h3>
                        {settings.ownerName && <p className="text-sm text-stone-600">{settings.ownerName}</p>}
                        {settings.document && <p className="text-sm text-stone-500">CPF/CNPJ: {settings.document}</p>}
                        {settings.address && (
                            <p className="text-sm text-stone-500">
                                {settings.address}
                                {settings.city && ` - ${settings.city}`}
                                {settings.state && `/${settings.state}`}
                                {settings.zipCode && ` - CEP: ${settings.zipCode}`}
                            </p>
                        )}
                        {(settings.phone || settings.email) && (
                            <p className="text-sm text-stone-500">
                                {settings.phone && `Tel: ${settings.phone}`}
                                {settings.phone && settings.email && ' | '}
                                {settings.email && `Email: ${settings.email}`}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
