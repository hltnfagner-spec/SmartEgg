import { FC } from 'react';
import { DailyRecord } from '../types';

type ProductionReportProps = {
  records: DailyRecord[];
  flockName: string;
  startDate: string;
  endDate: string;
};

const ProductionReport: FC<ProductionReportProps> = ({ records, flockName, startDate, endDate }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Relatório de Produção</h3>
      <p className="text-sm text-gray-600 mb-4">
        Período: {startDate} a {endDate} | Lote: {flockName}
      </p>
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-center text-gray-500">Relatório de produção em desenvolvimento</p>
      </div>
    </div>
  );
};

export default ProductionReport;
