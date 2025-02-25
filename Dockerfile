# Estágio de construção (build)
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração do projeto
COPY package.json ./

# Instala as dependências
RUN npm install --force

# Copia o restante do código-fonte
COPY . .

# Constrói a aplicação para produção
RUN npm build

# Estágio de produção
FROM node:20-alpine AS runner

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos necessários do estágio de construção
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expõe a porta que a aplicação vai rodar
EXPOSE 3000

# Define o comando para rodar a aplicação
CMD ["npm", "start"]