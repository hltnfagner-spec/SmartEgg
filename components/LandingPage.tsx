
import { FC, ReactNode } from 'react';
import { EggIcon, AIIcon, CalculatorIcon, TrendUpIcon, InventoryIcon, ReportIcon, DashboardIcon, FlockIcon, DataEntryIcon, SalesIcon, WhatsAppIcon } from './icons';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const FeatureCard: FC<{ icon: ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const TestimonialCard: FC<{ name: string; role: string; content: string; initial: string }> = ({ name, role, content, initial }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
    <div className="flex items-center space-x-1 text-amber-500 mb-6">
      {[1, 2, 3, 4, 5].map((_, i) => (
        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      ))}
    </div>
    <p className="text-slate-600 mb-6 italic flex-grow">"{content}"</p>
    <div className="flex items-center space-x-4 border-t border-slate-50 pt-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
            {initial}
        </div>
        <div>
            <h4 className="font-bold text-slate-900 text-sm">{name}</h4>
            <span className="text-xs text-slate-500">{role}</span>
        </div>
    </div>
  </div>
);

const LandingPage: FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-2">
               <img src="/logo.png" alt="SmartEgg Logo" className="h-10 w-auto" onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
               }}/>
               <span className="hidden text-3xl mr-2">🥚</span>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">SmartEgg</span>
            </div>
            <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-amber-600 transition-colors">Funcionalidades</a>
              <a href="#ai" className="hover:text-amber-600 transition-colors">Inteligência Artificial</a>
              <a href="#testimonials" className="hover:text-amber-600 transition-colors">Depoimentos</a>
            </div>
            <button 
              onClick={() => {
                console.log('[LandingPage] Botão Acessar Sistema clicado');
                onLogin();
              }}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Acessar Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wide mb-6">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
            Gestão Inteligente para Avicultura
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8">
            Sua Granja mais <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Produtiva</span> e <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Lucrativa</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed mb-10">
            Controle total da produção de ovos, gestão financeira, formulação de ração e insights poderosos com Inteligência Artificial. Tudo em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onRegister}
              className="px-8 py-4 bg-amber-600 text-white text-lg font-bold rounded-xl hover:bg-amber-700 transition-all shadow-xl hover:shadow-amber-500/30 transform hover:-translate-y-1"
            >
              Começar Agora Gratuitamente
            </button>
            <button className="px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
              Ver Demonstração
            </button>
          </div>
        </div>
      </section>

      {/* Realistic Dashboard Mockup */}
      <section className="px-4 mb-24">
         <div className="max-w-6xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
                
                {/* Browser Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="bg-white border border-slate-200 rounded-md py-1 px-3 text-xs text-slate-400 inline-flex items-center w-64 justify-center">
                            <span className="mr-2">🔒</span> smartegg.app.br/dashboard
                        </div>
                    </div>
                </div>

                {/* App Interface */}
                <div className="flex h-[500px] md:h-[600px] bg-slate-50">
                    
                    {/* Real Sidebar Look */}
                    <div className="hidden md:flex w-64 bg-slate-900 flex-col flex-shrink-0">
                        <div className="h-16 flex items-center px-6 border-b border-slate-800">
                             <div className="text-2xl mr-2">🥚</div>
                             <div className="font-bold text-white text-lg">SmartEgg</div>
                        </div>
                        <div className="p-4 space-y-1">
                            <div className="bg-orange-500 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center shadow-md">
                                <DashboardIcon className="w-5 h-5 mr-3" /> Dashboard
                            </div>
                            <div className="text-slate-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center">
                                <FlockIcon className="w-5 h-5 mr-3" /> Lotes
                            </div>
                            <div className="text-slate-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center">
                                <DataEntryIcon className="w-5 h-5 mr-3" /> Coleta de Ovos
                            </div>
                            <div className="text-slate-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center">
                                <InventoryIcon className="w-5 h-5 mr-3" /> Estoque
                            </div>
                            <div className="text-slate-400 px-4 py-3 rounded-lg text-sm font-medium flex items-center">
                                <SalesIcon className="w-5 h-5 mr-3" /> Vendas
                            </div>
                        </div>
                    </div>

                    {/* Real Dashboard Content Look */}
                    <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-full border border-slate-200 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                </div>
                                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold border border-amber-200">
                                    GS
                                </div>
                            </div>
                        </div>

                        {/* Stat Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                 <div className="flex items-center gap-3 mb-2">
                                     <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><EggIcon className="w-5 h-5" /></div>
                                     <span className="text-xs font-medium text-slate-500">Ovos Hoje</span>
                                 </div>
                                 <div className="text-2xl font-bold text-slate-800">4,850</div>
                                 <div className="text-xs text-green-600 font-medium mt-1">↑ 2.5% vs ontem</div>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                 <div className="flex items-center gap-3 mb-2">
                                     <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FlockIcon className="w-5 h-5" /></div>
                                     <span className="text-xs font-medium text-slate-500">Aves Ativas</span>
                                 </div>
                                 <div className="text-2xl font-bold text-slate-800">5,200</div>
                                 <div className="text-xs text-slate-400 font-medium mt-1">3 Lotes</div>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hidden md:block">
                                 <div className="flex items-center gap-3 mb-2">
                                     <div className="p-2 bg-green-100 rounded-lg text-green-600"><SalesIcon className="w-5 h-5" /></div>
                                     <span className="text-xs font-medium text-slate-500">Receita Mês</span>
                                 </div>
                                 <div className="text-2xl font-bold text-slate-800">R$ 14.2k</div>
                                 <div className="text-xs text-green-600 font-medium mt-1">↑ 12% vs mês ant.</div>
                             </div>
                             <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hidden md:block">
                                 <div className="flex items-center gap-3 mb-2">
                                     <div className="p-2 bg-red-100 rounded-lg text-red-600"><TrendUpIcon className="w-5 h-5" /></div>
                                     <span className="text-xs font-medium text-slate-500">Despesas</span>
                                 </div>
                                 <div className="text-2xl font-bold text-slate-800">R$ 4.8k</div>
                             </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                            <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
                                <h3 className="font-semibold text-slate-700 mb-6">Produção Semanal (Caixas)</h3>
                                <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-2">
                                    {[35, 42, 38, 55, 48, 60, 58].map((h, i) => (
                                        <div key={i} className="w-full bg-slate-50 rounded-t-lg relative group h-full flex flex-col justify-end">
                                            <div className="w-full bg-amber-500 rounded-t-md hover:bg-amber-600 transition-colors relative" style={{ height: `${h}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {h * 10}
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 text-center mt-2">
                                                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hidden md:flex flex-col">
                                <h3 className="font-semibold text-slate-700 mb-4">Qualidade</h3>
                                <div className="flex-1 flex flex-col justify-center items-center relative">
                                    <div className="w-32 h-32 rounded-full border-[12px] border-slate-100 border-t-green-500 border-r-green-500 border-b-green-500 transform -rotate-45 relative">
                                        <div className="absolute inset-0 flex items-center justify-center flex-col transform rotate-45">
                                            <span className="text-2xl font-bold text-slate-800">97%</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Aprovados</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="flex items-center text-slate-600"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Bons</span>
                                        <span className="font-medium">4,705</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="flex items-center text-slate-600"><span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>Trincados</span>
                                        <span className="font-medium">145</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tudo o que você precisa para crescer</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Substitua planilhas complicadas por um sistema intuitivo projetado especificamente para produtores de ovos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<EggIcon />}
              title="Controle de Produção"
              description="Registre a coleta diária, monitore perdas, ovos trincados e acompanhe a curva de postura de cada lote."
            />
             <FeatureCard 
              icon={<TrendUpIcon />}
              title="Gestão Financeira"
              description="Controle vendas, despesas, fluxo de caixa e saiba exatamente o lucro por ovo e por lote."
            />
            <FeatureCard 
              icon={<CalculatorIcon />}
              title="Formulação de Ração"
              description="Crie fórmulas balanceadas, calcule custos por batida e gerencie os ingredientes nutricionais."
            />
            <FeatureCard 
              icon={<InventoryIcon />}
              title="Estoque Inteligente"
              description="Controle insumos, embalagens e medicamentos. Receba alertas automáticos quando o estoque estiver baixo."
            />
             <FeatureCard 
              icon={<ReportIcon />}
              title="Relatórios em PDF"
              description="Gere relatórios profissionais de produção e financeiros para análise ou para apresentar a parceiros e bancos."
            />
             <FeatureCard 
              icon={<AIIcon />}
              title="Consultor Virtual 24h"
              description="Tire dúvidas técnicas e peça análises de dados para nossa IA treinada em avicultura de postura."
            />
          </div>
        </div>
      </section>

      {/* Middle CTA Section - WhatsApp */}
      <section className="py-16 bg-amber-50 border-y border-amber-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Ainda tem dúvidas se o SmartEgg é para você?</h2>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                  Nossa equipe de especialistas em avicultura está pronta para responder suas perguntas e mostrar como podemos ajudar sua granja a lucrar mais.
              </p>
              <a 
                  href="https://wa.me/5586981534815" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-full transition-all shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1"
              >
                  <WhatsAppIcon className="w-6 h-6 mr-2" />
                  Falar com Especialista
              </a>
          </div>
      </section>

      {/* AI Highlight Section */}
      <section id="ai" className="py-20 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
               <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wide mb-6 border border-amber-500/30">
                Powered by Gemini AI
              </div>
              <h2 className="text-4xl font-bold mb-6">Tome decisões baseadas em dados, não em palpites.</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                O SmartEgg analisa seus dados históricos de produção, consumo de ração e mortalidade para oferecer insights valiosos. Pergunte à IA:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-amber-100">
                  <span className="mr-3 bg-amber-600 p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
                  "Por que a produção do Lote A caiu ontem?"
                </li>
                <li className="flex items-center text-amber-100">
                  <span className="mr-3 bg-amber-600 p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
                  "Como posso otimizar o custo da ração atual?"
                </li>
                <li className="flex items-center text-amber-100">
                  <span className="mr-3 bg-amber-600 p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
                  "Qual é a previsão de lucro para o próximo mês?"
                </li>
              </ul>
              <button onClick={onRegister} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors">
                Experimentar IA Agora
              </button>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                  <div className="flex items-start gap-4 mb-6">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <AIIcon className="text-white" />
                      </div>
                      <div className="bg-slate-700 p-4 rounded-r-xl rounded-bl-xl text-slate-200 text-sm">
                          Com base nos registros dos últimos 7 dias, notei que o consumo de ração do Lote 3 aumentou 5%, mas a produção de ovos se manteve estável. Isso pode indicar desperdício nos comedouros ou início de um problema sanitário. Sugiro verificar os equipamentos.
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 h-10 rounded-full opacity-50"></div>
                      <div className="w-10 h-10 bg-amber-600 rounded-full opacity-50"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Quem usa, recomenda</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Veja como produtores de todo o Brasil estão otimizando suas granjas com o SmartEgg.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <TestimonialCard 
                    name="Carlos Mendes"
                    role="Granja Ouro Branco"
                    initial="CM"
                    content="O SmartEgg mudou minha rotina. Antes eu perdia horas em planilhas de papel e nunca sabia o lucro real. Agora tenho tudo no celular em segundos."
                />
                <TestimonialCard 
                    name="Ana Souza"
                    role="Avicultura Souza"
                    initial="AS"
                    content="A ferramenta de formulação de ração é incrível! Consegui ajustar a dieta das aves e reduzir meus custos em 15% logo no primeiro mês de uso."
                />
                <TestimonialCard 
                    name="Roberto Lima"
                    role="Produtor Rural"
                    initial="RL"
                    content="Eu tinha dificuldade com tecnologia, mas o sistema é muito simples e direto. O suporte pelo WhatsApp também faz toda a diferença quando tenho dúvidas."
                />
            </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Pronto para transformar sua granja?</h2>
              <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                  Junte-se a centenas de produtores que estão economizando tempo e aumentando lucros com o SmartEgg.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                      onClick={onRegister}
                      className="px-8 py-4 bg-amber-600 text-white text-lg font-bold rounded-xl hover:bg-amber-700 transition-all shadow-xl hover:shadow-amber-500/30"
                  >
                      Criar Conta Grátis
                  </button>
                  <a 
                      href="https://wa.me/5586981534815" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-8 py-4 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 transition-all shadow-xl hover:shadow-green-500/30 flex items-center justify-center"
                  >
                      <WhatsAppIcon className="w-6 h-6 mr-2" />
                      Chamar no WhatsApp
                  </a>
              </div>
          </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-slate-50 pt-10 pb-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
                    <span className="text-2xl">🥚</span>
                    <span className="text-xl font-bold text-slate-900">SmartEgg</span>
            </div>
            <p className="text-slate-500 text-sm mb-4">
                Tecnologia acessível para transformar a gestão de pequenas e médias granjas de postura.
            </p>
            <p className="text-slate-400 text-sm">© {new Date().getFullYear()} SmartEgg. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
