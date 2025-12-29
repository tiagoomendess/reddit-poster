
// enum with flair ids
const FLAIRS = {
    SOCIEDADE: 'e310ccdc-8a1e-11ef-b8bf-ce377cc05538',
    POLITICA: 'df366056-8a1c-11ef-8530-ce05fd09b1f9',
    MOBILIDADE: '04cd4262-8a1d-11ef-94cb-42cbe53ad83a',
    CULTURA: 'c2127856-8a22-11ef-8a3d-e63bb498c986',
    DESPORTO: 'dda6ca06-8a20-11ef-85af-c6759ad5339e',
    AVISO: '41cd09de-8a2e-11ef-b2e7-9e4c96604ba5',
    SAUDE: '6a387422-8a23-11ef-a0a3-96ab2acc48d8',
    ECONOMIA: 'fa2da572-8a21-11ef-834b-5636c175a66c',
    OPINIAO: '8f59e0e8-8a1d-11ef-b2e0-4a8f06d45212',
    POLICIA: 'dbcb5b42-8a21-11ef-acfa-9234061abf48',
    JUSTICA: '7d75e822-8a22-11ef-a0af-1a7ea5b27123',
    EDUCACAO: '46b793f2-8a23-11ef-9303-56f4d4184ad4',
    GASTRONOMIA: 'ef6deb2a-8a2f-11ef-94a3-26e355ea4b97',
    CLIMA: '6e162164-8a2f-11ef-bdd9-42cbe53ad83a',
    OUTRO: '320b3138-8a1f-11ef-ab49-cea25db94db1',
    OCORRENCIAS: 'ffdcbbdc-acb0-11ef-bc5b-322ffb57b1c0'
}

const FLAIR_MATCH = {
    POLITICA: ['câmara', 'ps', 'psd', 'cds', 'bloco', 'comunista', 'partido', 'política', 'político', 'governo', 'parlamento', 'assembleia', 'eleições', 'eleição', 'voto', 'votos', 'votar', 'votaram', 'votou', 'votaram'],
    OPINIAO: ['opiniao', 'opinião'],
    POLICIA: ['gnr', 'psp', 'tráfico', 'droga', 'estupefacientes', 'detido', 'detidos', 'detida', 'detidas', 'suspeito'],
    SOCIEDADE: [],
    MOBILIDADE: ['acidente', 'pavimentação', 'atropelado', 'atropelada', 'atropelamento', 'choque', 'despiste', 'despista-se', 'tuba', 'transportes', 'estrada', 'congestiona', 'congestionada', 'autocarros', 'autocarro', 'comboio', 'trânsito', 'bus'],
    CULTURA: ['concerto', 'concertos', 'teatro', 'cinema', 'música', 'museu', 'exposição', 'exposições', 'arte', 'artista', 'artistas', 'escultura', 'esculturas', 'pintura', 'pinturas', 'livro', 'livros', 'escritor', 'escritores', 'poesia', 'poeta', 'poetas', 'dança', 'dançar', 'dançarino', 'dançarinos', 'dançarina', 'dançarinas', 'bailarino', 'bailarinos', 'bailarina', 'bailarinas', 'espetáculo', 'espetáculos'],
    DESPORTO: ['futebol', 'afpb', 'jogador', 'jogadores', 'treinador'],
    AVISO: ['aviso', 'atenção', 'cuidado'],
    SAUDE: ['saude', 'saúde', 'médicos', 'médico', 'médica', 'hospital', 'vacina', 'enfermeiro', 'enfermeira', 'covid', 'coronavírus', 'pandemia', 'epidemia', 'doença', 'doenças', 'infetado'],
    ECONOMIA: ['desemprego', 'dinheiro', 'economia', 'emprego', 'empregos', 'salário', 'salários', 'trabalho', 'trabalhos', 'negócio', 'negócios', 'empresa', 'empresas', 'mercado', 'mercados', 'bolsa', 'bolsas', 'investimento', 'investimentos', 'fatura', 'faturar'],
    JUSTICA: ['julgamento', 'julgado', 'justiça', 'tribunal', 'audiência', 'advogado', 'advogados', 'juiz', 'juízes'],
    EDUCACAO: ['ipca', 'escola', 'escolas', 'politécnico', 'aulas', 'alunos', 'investigadores', 'colégio'],
    GASTRONOMIA: ['comer', 'comida', 'restaurante', 'restaurantes', 'cozinha', 'cozinhar', 'gastronomia', 'almoço', 'jantar', 'almoçar', 'jantar'],
    CLIMA: ['meteorologia', 'clima', 'temperatura', 'chuva', 'vento', 'sol', 'neve'],
    OUTRO: [],
    OCORRENCIAS: ['incêndio', 'inundação']
}

module.exports = {
    FLAIRS,
    FLAIR_MATCH
}
