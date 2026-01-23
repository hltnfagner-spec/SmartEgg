import React, { useState, useEffect } from 'react';

interface PurchaseInfo {
  mode: 'sack' | 'kg';
  sackWeight?: number;
  sackPrice?: number;
}

interface IngredientPriceInputProps {
  currentPrice?: number;
  ingredientName?: string;
  onPriceChange: (price: number, purchaseInfo: PurchaseInfo) => void;
  compact?: boolean;
}

const IngredientPriceInput: React.FC<IngredientPriceInputProps> = ({
  currentPrice = 0,
  ingredientName = '',
  onPriceChange,
  compact = false
}) => {
  const [sackWeight, setSackWeight] = useState('');
  const [sackPrice, setSackPrice] = useState('');

  // Carregar peso lembrado do localStorage
  useEffect(() => {
    if (ingredientName) {
      const savedWeight = localStorage.getItem(`sack-weight-${ingredientName}`);
      if (savedWeight) {
        setSackWeight(savedWeight);
      }
    }
  }, [ingredientName]);

  // Salvar peso no localStorage quando mudar
  useEffect(() => {
    if (ingredientName && sackWeight) {
      localStorage.setItem(`sack-weight-${ingredientName}`, sackWeight);
    }
  }, [sackWeight, ingredientName]);

  const calculateFinalPrice = (): number => {
    if (sackPrice && sackWeight) {
      const price = parseFloat(sackPrice);
      const weight = parseFloat(sackWeight);
      if (!isNaN(price) && !isNaN(weight) && weight > 0) {
        return price / weight;
      }
    }
    return 0;
  };

  useEffect(() => {
    const finalPrice = calculateFinalPrice();
    if (finalPrice > 0) {
      onPriceChange(finalPrice, {
        mode: 'sack',
        sackWeight: parseFloat(sackWeight),
        sackPrice: parseFloat(sackPrice),
      });
    }
  }, [sackPrice, sackWeight]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Valor da Saca (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={sackPrice}
              onChange={e => setSackPrice(e.target.value)}
              placeholder="Ex: 45.00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Peso da Saca (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={sackWeight}
              onChange={e => setSackWeight(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="Ex: 50"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Resultado Calculado */}
        {sackPrice && parseFloat(sackPrice) > 0 && sackWeight && parseFloat(sackWeight) > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-600 mb-1 font-medium">Preço Calculado:</div>
            <div className="text-2xl font-bold text-blue-700">
              R$ {calculateFinalPrice().toFixed(2)}/kg
            </div>
            <div className="text-xs text-blue-500 mt-1">
              Saca de {parseFloat(sackWeight).toFixed(1)}kg por R$ {parseFloat(sackPrice).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientPriceInput;
