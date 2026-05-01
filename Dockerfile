FROM ruby:3.3-slim

RUN apt-get update -qq && apt-get install -y \
    build-essential \
    libpq-dev \
    libyaml-dev \
    curl \
    git \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

# Install Ruby deps
COPY Gemfile Gemfile.lock kidspire.gemspec ./
COPY lib/kidspire/version.rb lib/kidspire/version.rb
RUN bundle install

# Install JS deps
COPY package.json bun.lock ./
RUN bun install

# Copy app and build frontend
COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
