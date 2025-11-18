import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
      
      <p className="mb-4 text-muted-foreground">
        Última atualização: [Inserir Data da Última Atualização]
      </p>

      <div className="prose prose-lg max-w-none"> {/* Usa classes 'prose' do Tailwind para formatação */}
        <p className="font-bold text-red-600 mb-6">
        </p>

        <h2>1. Introdução</h2>
        <p>
          Bem-vindo ao Diário Pet+. Levamos a sua privacidade a sério. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nosso aplicativo e serviços. Ao usar o Diário Pet+, você concorda com a coleta e uso de informações de acordo com esta política.
        </p>

        <h2>2. Informações que Coletamos</h2>
        <p>Podemos coletar informações sobre você de diversas formas:</p>
        <ul>
          <li><strong>Informações Pessoais Identificáveis:</strong> Nome, endereço de e-mail, etc., que você fornece voluntariamente ao se registrar ou usar certas funcionalidades.</li>
          <li><strong>Informações do Pet:</strong> Nome, espécie, raça, data de nascimento, registros de saúde, fotos, etc., que você insere no aplicativo.</li>
          <li><strong>Dados de Uso:</strong> Informações sobre como você usa o aplicativo, coletadas automaticamente.</li>
          <li><strong>Dados de Localização:</strong> Podemos solicitar acesso à sua localização para funcionalidades como "Alerta Pet" e "Serviços Locais".</li>
        </ul>

        <h2>3. Como Usamos Suas Informações</h2>
        <p>Usamos as informações coletadas para:</p>
        <ul>
          <li>Fornecer, operar e manter nosso aplicativo.</li>
          <li>Melhorar, personalizar e expandir nosso aplicativo.</li>
          <li>Entender e analisar como você usa nosso aplicativo.</li>
          <li>Desenvolver novos produtos, serviços e funcionalidades.</li>
          <li>Comunicar com você (suporte, atualizações, marketing).</li>
          <li>Processar suas transações (assinaturas, se aplicável).</li>
          <li>Encontrar e prevenir fraudes.</li>
          <li>Cumprir obrigações legais.</li>
        </ul>

        <h2>4. Compartilhamento de Informações</h2>
        <p>
          Não compartilhamos suas informações pessoais identificáveis com terceiros, exceto nas seguintes situações: [Descrever exceções, como provedores de serviço, cumprimento da lei, etc.]. As informações dos pets podem ser compartilhadas de forma anônima ou agregada para fins de pesquisa ou estatística.
        </p>
        
        {/* Adicionar seções sobre: Segurança dos Dados, Direitos do Usuário (LGPD), Cookies, Transferência Internacional, Alterações na Política, Contato */}

        <h2>5. Seus Direitos (LGPD)</h2>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, excluir ou solicitar a portabilidade de seus dados. Para exercer esses direitos, entre em contato conosco através do [Inserir Método de Contato].
        </p>

        <h2>6. Contato</h2>
        <p>
          Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco: [Inserir E-mail ou Formulário de Contato].
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;