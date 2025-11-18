// src/pages/TermsOfUse.tsx
import React from 'react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>

      <p className="mb-4 text-muted-foreground">
        Última atualização: 18/11/2025
      </p>

      <div className="prose prose-lg max-w-none">
        <p className="font-bold text-red-600 mb-6">
        </p>

        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e usar o aplicativo Clube Futuro Palpites ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com estes termos, não utilize o Serviço.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          O Clube Futuro Palpites é uma plataforma digital que permite aos usuários criar e participar de bolões de futebol em diversos campeonatos.
        </p>

        <h2>3. Contas de Usuário</h2>
        <p>
          Você é responsável por manter a confidencialidade de sua conta e senha e por todas as atividades que ocorrem sob sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
        </p>

        <h2>4. Conduta do Usuário</h2>
        <p>Você concorda em não usar o Serviço para:</p>
        <ul>
          <li>Publicar conteúdo ilegal, prejudicial, ameaçador, abusivo, difamatório, vulgar, obsceno ou censurável.</li>
          <li>Violar quaisquer leis locais, estaduais, nacionais ou internacionais.</li>
          <li>Personificar qualquer pessoa ou entidade.</li>
          <li>Tirar muito sarro dos amiguinhos quando eles fizerem menos pontos que você.</li>
          {/* Adicionar outras regras de conduta */}
        </ul>

        <h2>5. Propriedade Intelectual</h2>
        <p>
          O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva do Clube Futuro Palpites e seus licenciadores.
        </p>

        <h2>6. Limitação de Responsabilidade</h2>
        <p>
          Em nenhuma circunstância o Clube Futuro Palpites será responsável por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos. O Clube Futuro Palpites não se responsabiliza pelas interações entre usuários ou pela veracidade das informações postadas.
        </p>

        {/* Adicionar seções sobre: Modificações no Serviço, Rescisão, Lei Aplicável, Contato */}

        <h2>7. Lei Aplicável</h2>
        <p>
          Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem consideração a conflitos de disposições legais.
        </p>

        <h2>8. Contato</h2>
        <p>
          Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco: contato@clubefuturo.com.
        </p>
      </div>
    </div>
  );
};

export default TermsOfUse;