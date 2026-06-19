# ---- Build stage: render the Jekyll site ----
FROM ruby:3.0-slim AS build

WORKDIR /srv/jekyll

# System deps:
#  - build-essential / git: compile native gems, jekyll-github-metadata
#  - imagemagick + libmagickwand-dev: jekyll-imagemagick responsive images
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        git \
        imagemagick \
        libmagickwand-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install gems first for better layer caching
COPY Gemfile ./
RUN gem install bundler && bundle install --jobs 4 --retry 3

# Build the site
COPY . .
RUN JEKYLL_ENV=production bundle exec jekyll build --destination /srv/_site

# ---- Serve stage: static files via nginx ----
FROM nginx:alpine

COPY --from=build /srv/_site /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
