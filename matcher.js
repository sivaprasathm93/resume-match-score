// matcher.js — Resume Match Score Engine
// Skills database, extraction, matching, scoring, and suggestion generation

// ─────────────────────────────────────────────
// 1. SKILLS DATABASE
// ─────────────────────────────────────────────

const SKILLS_DATABASE = {
  // ── Programming Languages ──
  'javascript':    { display: 'JavaScript',    category: 'Programming Languages', aliases: ['js', 'es6', 'es2015', 'ecmascript', 'es2020', 'es2021', 'vanilla js'] },
  'typescript':    { display: 'TypeScript',    category: 'Programming Languages', aliases: ['ts'] },
  'python':        { display: 'Python',        category: 'Programming Languages', aliases: ['python3', 'py'] },
  'java':          { display: 'Java',          category: 'Programming Languages', aliases: [] },
  'c#':            { display: 'C#',            category: 'Programming Languages', aliases: ['csharp', 'c sharp', 'c-sharp', 'dotnet c#'] },
  'c++':           { display: 'C++',           category: 'Programming Languages', aliases: ['cpp', 'c plus plus'] },
  'c':             { display: 'C',             category: 'Programming Languages', aliases: [] },
  'go':            { display: 'Go',            category: 'Programming Languages', aliases: ['golang'] },
  'rust':          { display: 'Rust',          category: 'Programming Languages', aliases: ['rustlang'] },
  'ruby':          { display: 'Ruby',          category: 'Programming Languages', aliases: [] },
  'php':           { display: 'PHP',           category: 'Programming Languages', aliases: [] },
  'swift':         { display: 'Swift',         category: 'Programming Languages', aliases: [] },
  'kotlin':        { display: 'Kotlin',        category: 'Programming Languages', aliases: ['kt'] },
  'scala':         { display: 'Scala',         category: 'Programming Languages', aliases: [] },
  'r':             { display: 'R',             category: 'Programming Languages', aliases: ['rlang', 'r language'] },
  'dart':          { display: 'Dart',          category: 'Programming Languages', aliases: [] },
  'perl':          { display: 'Perl',          category: 'Programming Languages', aliases: [] },
  'shell':         { display: 'Shell/Bash',    category: 'Programming Languages', aliases: ['bash', 'sh', 'zsh', 'shell scripting', 'bash scripting'] },
  'sql':           { display: 'SQL',           category: 'Programming Languages', aliases: ['structured query language'] },
  'objective-c':   { display: 'Objective-C',   category: 'Programming Languages', aliases: ['objc', 'obj-c'] },
  'lua':           { display: 'Lua',           category: 'Programming Languages', aliases: [] },
  'elixir':        { display: 'Elixir',        category: 'Programming Languages', aliases: [] },
  'haskell':       { display: 'Haskell',       category: 'Programming Languages', aliases: [] },
  'clojure':       { display: 'Clojure',       category: 'Programming Languages', aliases: [] },
  'julia':         { display: 'Julia',         category: 'Programming Languages', aliases: [] },
  'matlab':        { display: 'MATLAB',        category: 'Programming Languages', aliases: [] },
  'groovy':        { display: 'Groovy',        category: 'Programming Languages', aliases: [] },
  'solidity':      { display: 'Solidity',      category: 'Programming Languages', aliases: [] },

  // ── Frontend ──
  'react':         { display: 'React',         category: 'Frontend', aliases: ['reactjs', 'react.js', 'react js'] },
  'angular':       { display: 'Angular',       category: 'Frontend', aliases: ['angularjs', 'angular.js', 'angular js', 'angular 2+'] },
  'vue':           { display: 'Vue.js',        category: 'Frontend', aliases: ['vuejs', 'vue.js', 'vue js', 'vue 3'] },
  'svelte':        { display: 'Svelte',        category: 'Frontend', aliases: ['sveltekit', 'svelte kit'] },
  'next.js':       { display: 'Next.js',       category: 'Frontend', aliases: ['nextjs', 'next js', 'next'] },
  'nuxt':          { display: 'Nuxt.js',       category: 'Frontend', aliases: ['nuxtjs', 'nuxt.js'] },
  'html':          { display: 'HTML',          category: 'Frontend', aliases: ['html5', 'html 5'] },
  'css':           { display: 'CSS',           category: 'Frontend', aliases: ['css3', 'css 3', 'cascading style sheets'] },
  'sass':          { display: 'Sass/SCSS',     category: 'Frontend', aliases: ['scss', 'sass css'] },
  'less':          { display: 'Less',          category: 'Frontend', aliases: ['less css', 'lesscss'] },
  'tailwind':      { display: 'Tailwind CSS',  category: 'Frontend', aliases: ['tailwindcss', 'tailwind css'] },
  'bootstrap':     { display: 'Bootstrap',     category: 'Frontend', aliases: ['bootstrap 5', 'bootstrap css'] },
  'material ui':   { display: 'Material UI',   category: 'Frontend', aliases: ['mui', 'material design', 'material-ui'] },
  'jquery':        { display: 'jQuery',        category: 'Frontend', aliases: ['j query'] },
  'redux':         { display: 'Redux',         category: 'Frontend', aliases: ['react redux', 'redux toolkit', 'rtk'] },
  'webpack':       { display: 'Webpack',       category: 'Frontend', aliases: [] },
  'vite':          { display: 'Vite',          category: 'Frontend', aliases: ['vitejs'] },
  'gatsby':        { display: 'Gatsby',        category: 'Frontend', aliases: ['gatsbyjs'] },
  'remix':         { display: 'Remix',         category: 'Frontend', aliases: ['remix.run'] },
  'astro':         { display: 'Astro',         category: 'Frontend', aliases: ['astro.build'] },
  'storybook':     { display: 'Storybook',     category: 'Frontend', aliases: [] },
  'three.js':      { display: 'Three.js',      category: 'Frontend', aliases: ['threejs', 'three js'] },
  'd3':            { display: 'D3.js',         category: 'Frontend', aliases: ['d3.js', 'd3js'] },
  'web components': { display: 'Web Components', category: 'Frontend', aliases: ['custom elements', 'shadow dom'] },
  'pwa':           { display: 'PWA',           category: 'Frontend', aliases: ['progressive web app', 'progressive web apps'] },

  // ── Backend ──
  'node.js':       { display: 'Node.js',       category: 'Backend', aliases: ['nodejs', 'node js', 'node'] },
  'express':       { display: 'Express.js',    category: 'Backend', aliases: ['expressjs', 'express.js'] },
  'django':        { display: 'Django',        category: 'Backend', aliases: ['django rest framework', 'drf'] },
  'flask':         { display: 'Flask',         category: 'Backend', aliases: [] },
  'fastapi':       { display: 'FastAPI',       category: 'Backend', aliases: ['fast api'] },
  'spring':        { display: 'Spring Boot',   category: 'Backend', aliases: ['spring boot', 'spring framework', 'spring mvc', 'springboot'] },
  '.net':          { display: '.NET',          category: 'Backend', aliases: ['dotnet', 'asp.net', 'asp net', '.net core', 'dotnet core'] },
  'rails':         { display: 'Ruby on Rails', category: 'Backend', aliases: ['ruby on rails', 'ror'] },
  'laravel':       { display: 'Laravel',       category: 'Backend', aliases: [] },
  'nestjs':        { display: 'NestJS',        category: 'Backend', aliases: ['nest.js', 'nest js'] },
  'gin':           { display: 'Gin',           category: 'Backend', aliases: ['gin gonic'] },
  'graphql':       { display: 'GraphQL',       category: 'Backend', aliases: ['graph ql'] },
  'rest api':      { display: 'REST API',      category: 'Backend', aliases: ['restful', 'restful api', 'rest apis', 'restful apis', 'rest', 'restful services', 'api design', 'api development'] },
  'grpc':          { display: 'gRPC',          category: 'Backend', aliases: ['g rpc'] },
  'microservices': { display: 'Microservices', category: 'Backend', aliases: ['micro services', 'microservice architecture', 'microservice'] },
  'websocket':     { display: 'WebSocket',     category: 'Backend', aliases: ['websockets', 'web socket', 'socket.io'] },
  'rabbitmq':      { display: 'RabbitMQ',      category: 'Backend', aliases: ['rabbit mq'] },
  'kafka':         { display: 'Kafka',         category: 'Backend', aliases: ['apache kafka'] },
  'celery':        { display: 'Celery',        category: 'Backend', aliases: [] },

  // ── Databases ──
  'postgresql':    { display: 'PostgreSQL',    category: 'Databases', aliases: ['postgres', 'psql', 'pg'] },
  'mysql':         { display: 'MySQL',         category: 'Databases', aliases: ['my sql'] },
  'mongodb':       { display: 'MongoDB',       category: 'Databases', aliases: ['mongo', 'mongo db'] },
  'redis':         { display: 'Redis',         category: 'Databases', aliases: [] },
  'sqlite':        { display: 'SQLite',        category: 'Databases', aliases: ['sq lite'] },
  'oracle':        { display: 'Oracle DB',     category: 'Databases', aliases: ['oracle database', 'oracle db', 'oracle sql'] },
  'sql server':    { display: 'SQL Server',    category: 'Databases', aliases: ['mssql', 'ms sql', 'microsoft sql server', 'sql server'] },
  'dynamodb':      { display: 'DynamoDB',      category: 'Databases', aliases: ['dynamo db', 'aws dynamodb'] },
  'cassandra':     { display: 'Cassandra',     category: 'Databases', aliases: ['apache cassandra'] },
  'elasticsearch': { display: 'Elasticsearch', category: 'Databases', aliases: ['elastic search', 'elastic', 'es'] },
  'neo4j':         { display: 'Neo4j',         category: 'Databases', aliases: [] },
  'firebase':      { display: 'Firebase',      category: 'Databases', aliases: ['firestore', 'firebase db'] },
  'supabase':      { display: 'Supabase',      category: 'Databases', aliases: [] },
  'couchdb':       { display: 'CouchDB',       category: 'Databases', aliases: ['couch db'] },

  // ── Cloud ──
  'aws':           { display: 'AWS',           category: 'Cloud', aliases: ['amazon web services', 'amazon aws', 'ec2', 's3', 'lambda', 'aws lambda', 'sqs', 'sns', 'ecs', 'eks', 'cloudfront'] },
  'azure':         { display: 'Azure',         category: 'Cloud', aliases: ['microsoft azure', 'azure cloud', 'azure devops'] },
  'gcp':           { display: 'Google Cloud',  category: 'Cloud', aliases: ['google cloud platform', 'google cloud', 'gce', 'gke', 'cloud functions'] },
  'heroku':        { display: 'Heroku',        category: 'Cloud', aliases: [] },
  'vercel':        { display: 'Vercel',        category: 'Cloud', aliases: [] },
  'netlify':       { display: 'Netlify',       category: 'Cloud', aliases: [] },
  'digitalocean':  { display: 'DigitalOcean',  category: 'Cloud', aliases: ['digital ocean'] },
  'cloudflare':    { display: 'Cloudflare',    category: 'Cloud', aliases: ['cloudflare workers'] },

  // ── DevOps ──
  'docker':        { display: 'Docker',        category: 'DevOps', aliases: ['dockerfile', 'docker compose', 'docker-compose'] },
  'kubernetes':    { display: 'Kubernetes',    category: 'DevOps', aliases: ['k8s', 'kube'] },
  'jenkins':       { display: 'Jenkins',       category: 'DevOps', aliases: [] },
  'github actions': { display: 'GitHub Actions', category: 'DevOps', aliases: ['gh actions'] },
  'gitlab ci':     { display: 'GitLab CI/CD',  category: 'DevOps', aliases: ['gitlab ci/cd', 'gitlab pipeline'] },
  'circleci':      { display: 'CircleCI',      category: 'DevOps', aliases: ['circle ci'] },
  'terraform':     { display: 'Terraform',     category: 'DevOps', aliases: ['tf', 'hashicorp terraform'] },
  'ansible':       { display: 'Ansible',       category: 'DevOps', aliases: [] },
  'puppet':        { display: 'Puppet',        category: 'DevOps', aliases: [] },
  'prometheus':    { display: 'Prometheus',    category: 'DevOps', aliases: [] },
  'grafana':       { display: 'Grafana',       category: 'DevOps', aliases: [] },
  'nginx':         { display: 'Nginx',         category: 'DevOps', aliases: [] },
  'apache':        { display: 'Apache',        category: 'DevOps', aliases: ['apache http', 'httpd'] },
  'ci/cd':         { display: 'CI/CD',         category: 'DevOps', aliases: ['ci cd', 'cicd', 'continuous integration', 'continuous deployment', 'continuous delivery'] },
  'linux':         { display: 'Linux',         category: 'DevOps', aliases: ['ubuntu', 'centos', 'debian', 'rhel', 'red hat'] },
  'helm':          { display: 'Helm',          category: 'DevOps', aliases: ['helm charts'] },
  'argocd':        { display: 'ArgoCD',        category: 'DevOps', aliases: ['argo cd'] },
  'datadog':       { display: 'Datadog',       category: 'DevOps', aliases: ['data dog'] },
  'splunk':        { display: 'Splunk',        category: 'DevOps', aliases: [] },
  'new relic':     { display: 'New Relic',     category: 'DevOps', aliases: ['newrelic'] },

  // ── Data & ML ──
  'tensorflow':    { display: 'TensorFlow',    category: 'Data & ML', aliases: ['tf', 'tensor flow'] },
  'pytorch':       { display: 'PyTorch',       category: 'Data & ML', aliases: ['py torch'] },
  'scikit-learn':  { display: 'Scikit-learn',  category: 'Data & ML', aliases: ['sklearn', 'scikit learn'] },
  'pandas':        { display: 'Pandas',        category: 'Data & ML', aliases: [] },
  'numpy':         { display: 'NumPy',         category: 'Data & ML', aliases: ['num py'] },
  'keras':         { display: 'Keras',         category: 'Data & ML', aliases: [] },
  'opencv':        { display: 'OpenCV',        category: 'Data & ML', aliases: ['open cv', 'cv2'] },
  'spark':         { display: 'Apache Spark',  category: 'Data & ML', aliases: ['apache spark', 'pyspark'] },
  'hadoop':        { display: 'Hadoop',        category: 'Data & ML', aliases: ['apache hadoop', 'hdfs', 'mapreduce'] },
  'airflow':       { display: 'Apache Airflow',category: 'Data & ML', aliases: ['apache airflow'] },
  'dbt':           { display: 'dbt',           category: 'Data & ML', aliases: ['data build tool'] },
  'tableau':       { display: 'Tableau',       category: 'Data & ML', aliases: [] },
  'power bi':      { display: 'Power BI',      category: 'Data & ML', aliases: ['powerbi', 'power-bi'] },
  'looker':        { display: 'Looker',        category: 'Data & ML', aliases: [] },
  'snowflake':     { display: 'Snowflake',     category: 'Data & ML', aliases: [] },
  'bigquery':      { display: 'BigQuery',      category: 'Data & ML', aliases: ['big query', 'google bigquery'] },
  'redshift':      { display: 'Redshift',      category: 'Data & ML', aliases: ['aws redshift', 'amazon redshift'] },
  'databricks':    { display: 'Databricks',    category: 'Data & ML', aliases: [] },
  'jupyter':       { display: 'Jupyter',       category: 'Data & ML', aliases: ['jupyter notebook', 'jupyter lab', 'jupyterlab'] },
  'nlp':           { display: 'NLP',           category: 'Data & ML', aliases: ['natural language processing', 'text mining'] },
  'computer vision': { display: 'Computer Vision', category: 'Data & ML', aliases: ['cv', 'image processing', 'image recognition'] },
  'deep learning': { display: 'Deep Learning', category: 'Data & ML', aliases: ['dl', 'neural networks', 'neural network'] },
  'machine learning': { display: 'Machine Learning', category: 'Data & ML', aliases: ['ml'] },
  'data science':  { display: 'Data Science',  category: 'Data & ML', aliases: ['data analytics', 'data analysis'] },
  'llm':           { display: 'LLM',           category: 'Data & ML', aliases: ['large language model', 'large language models', 'generative ai', 'gen ai'] },
  'langchain':     { display: 'LangChain',     category: 'Data & ML', aliases: ['lang chain'] },
  'hugging face':  { display: 'Hugging Face',  category: 'Data & ML', aliases: ['huggingface', 'transformers'] },
  'mlops':         { display: 'MLOps',         category: 'Data & ML', aliases: ['ml ops', 'mlflow'] },
  'etl':           { display: 'ETL',           category: 'Data & ML', aliases: ['extract transform load', 'data pipeline', 'data pipelines'] },
  'data warehouse': { display: 'Data Warehouse', category: 'Data & ML', aliases: ['data warehousing', 'dwh'] },

  // ── Testing ──
  'jest':          { display: 'Jest',          category: 'Testing', aliases: [] },
  'mocha':         { display: 'Mocha',         category: 'Testing', aliases: [] },
  'pytest':        { display: 'Pytest',        category: 'Testing', aliases: ['py test'] },
  'junit':         { display: 'JUnit',         category: 'Testing', aliases: ['j unit'] },
  'selenium':      { display: 'Selenium',      category: 'Testing', aliases: ['selenium webdriver'] },
  'cypress':       { display: 'Cypress',       category: 'Testing', aliases: ['cypress.io'] },
  'playwright':    { display: 'Playwright',    category: 'Testing', aliases: [] },
  'enzyme':        { display: 'Enzyme',        category: 'Testing', aliases: [] },
  'testing library': { display: 'Testing Library', category: 'Testing', aliases: ['react testing library', '@testing-library'] },
  'unit testing':  { display: 'Unit Testing',  category: 'Testing', aliases: ['unit tests'] },
  'integration testing': { display: 'Integration Testing', category: 'Testing', aliases: ['integration tests'] },
  'e2e testing':   { display: 'E2E Testing',   category: 'Testing', aliases: ['end to end testing', 'end-to-end testing', 'e2e tests'] },

  // ── Mobile ──
  'react native':  { display: 'React Native',  category: 'Mobile', aliases: ['react-native', 'rn'] },
  'flutter':       { display: 'Flutter',       category: 'Mobile', aliases: [] },
  'swiftui':       { display: 'SwiftUI',       category: 'Mobile', aliases: ['swift ui'] },
  'jetpack compose': { display: 'Jetpack Compose', category: 'Mobile', aliases: ['compose'] },
  'android':       { display: 'Android',       category: 'Mobile', aliases: ['android sdk', 'android development'] },
  'ios':           { display: 'iOS',           category: 'Mobile', aliases: ['ios development', 'iphone'] },
  'xamarin':       { display: 'Xamarin',       category: 'Mobile', aliases: [] },
  'ionic':         { display: 'Ionic',         category: 'Mobile', aliases: [] },
  'expo':          { display: 'Expo',          category: 'Mobile', aliases: [] },

  // ── Tools & Platforms ──
  'git':           { display: 'Git',           category: 'Tools', aliases: ['git version control'] },
  'github':        { display: 'GitHub',        category: 'Tools', aliases: ['git hub'] },
  'gitlab':        { display: 'GitLab',        category: 'Tools', aliases: ['git lab'] },
  'bitbucket':     { display: 'Bitbucket',     category: 'Tools', aliases: ['bit bucket'] },
  'jira':          { display: 'Jira',          category: 'Tools', aliases: ['atlassian jira'] },

  'figma':         { display: 'Figma',         category: 'Tools', aliases: [] },
  'sketch':        { display: 'Sketch',        category: 'Tools', aliases: [] },
  'postman':       { display: 'Postman',       category: 'Tools', aliases: [] },
  'swagger':       { display: 'Swagger',       category: 'Tools', aliases: ['openapi', 'open api'] },
  'npm':           { display: 'npm',           category: 'Tools', aliases: ['node package manager'] },
  'yarn':          { display: 'Yarn',          category: 'Tools', aliases: [] },
  'pnpm':          { display: 'pnpm',          category: 'Tools', aliases: [] },
  'maven':         { display: 'Maven',         category: 'Tools', aliases: ['apache maven'] },
  'gradle':        { display: 'Gradle',        category: 'Tools', aliases: [] },
  'pip':           { display: 'pip',           category: 'Tools', aliases: [] },
  'slack':         { display: 'Slack',         category: 'Tools', aliases: [] },
  'notion':        { display: 'Notion',        category: 'Tools', aliases: [] },
  'trello':        { display: 'Trello',        category: 'Tools', aliases: [] },

  // ── Security ──
  'oauth':         { display: 'OAuth',         category: 'Security', aliases: ['oauth2', 'oauth 2.0', 'open authorization'] },
  'jwt':           { display: 'JWT',           category: 'Security', aliases: ['json web token', 'json web tokens'] },
  'ssl':           { display: 'SSL/TLS',       category: 'Security', aliases: ['tls', 'https', 'ssl/tls'] },
  'encryption':    { display: 'Encryption',    category: 'Security', aliases: ['data encryption', 'aes', 'rsa'] },
  'owasp':         { display: 'OWASP',         category: 'Security', aliases: ['owasp top 10'] },
  'sso':           { display: 'SSO',           category: 'Security', aliases: ['single sign on', 'single sign-on'] },
  'saml':          { display: 'SAML',          category: 'Security', aliases: [] },
  'ldap':          { display: 'LDAP',          category: 'Security', aliases: ['active directory', 'ad'] },

  // ── Methodologies ──
  'agile':         { display: 'Agile',         category: 'Methodologies', aliases: ['agile methodology', 'agile development'] },
  'scrum':         { display: 'Scrum',         category: 'Methodologies', aliases: ['scrum master', 'scrum methodology'] },
  'kanban':        { display: 'Kanban',        category: 'Methodologies', aliases: [] },
  'tdd':           { display: 'TDD',           category: 'Methodologies', aliases: ['test driven development', 'test-driven development'] },
  'bdd':           { display: 'BDD',           category: 'Methodologies', aliases: ['behavior driven development', 'behaviour driven development'] },
  'devops':        { display: 'DevOps',        category: 'Methodologies', aliases: ['dev ops'] },
  'design patterns': { display: 'Design Patterns', category: 'Methodologies', aliases: ['singleton', 'factory pattern', 'observer pattern'] },
  'solid':         { display: 'SOLID',         category: 'Methodologies', aliases: ['solid principles'] },
  'oop':           { display: 'OOP',           category: 'Methodologies', aliases: ['object oriented programming', 'object-oriented programming', 'object oriented'] },
  'functional programming': { display: 'Functional Programming', category: 'Methodologies', aliases: ['fp'] },
  'system design': { display: 'System Design', category: 'Methodologies', aliases: ['systems design', 'architecture design', 'software architecture'] },

  'pair programming': { display: 'Pair Programming', category: 'Methodologies', aliases: [] },

  'sre':           { display: 'SRE',           category: 'Methodologies', aliases: ['site reliability engineering', 'site reliability'] },

  // ── Soft Skills ──


  'problem solving': { display: 'Problem Solving', category: 'Soft Skills', aliases: ['problem-solving', 'analytical thinking', 'critical thinking'] },

  'project management': { display: 'Project Management', category: 'Soft Skills', aliases: ['pm', 'project planning'] },
  'mentoring':     { display: 'Mentoring',     category: 'Soft Skills', aliases: ['mentorship', 'coaching'] },
  'presentation':  { display: 'Presentation',  category: 'Soft Skills', aliases: ['presentation skills', 'public speaking'] },
  'time management': { display: 'Time Management', category: 'Soft Skills', aliases: [] },
  'adaptability':  { display: 'Adaptability',  category: 'Soft Skills', aliases: ['flexibility', 'fast learner', 'quick learner'] },
  'stakeholder management': { display: 'Stakeholder Management', category: 'Soft Skills', aliases: ['stakeholder engagement', 'client management'] },

  // ── Certifications ──
  'aws certified': { display: 'AWS Certified', category: 'Certifications', aliases: ['aws certification', 'aws solutions architect', 'aws developer', 'aws sysops'] },
  'azure certified': { display: 'Azure Certified', category: 'Certifications', aliases: ['azure certification', 'az-900', 'az-104', 'az-204'] },
  'gcp certified': { display: 'GCP Certified', category: 'Certifications', aliases: ['google cloud certified', 'gcp certification'] },
  'pmp':           { display: 'PMP',           category: 'Certifications', aliases: ['project management professional'] },
  'csm':           { display: 'CSM',           category: 'Certifications', aliases: ['certified scrum master'] },
  'cissp':         { display: 'CISSP',         category: 'Certifications', aliases: ['certified information systems security professional'] },
  'cka':           { display: 'CKA',           category: 'Certifications', aliases: ['certified kubernetes administrator'] },
};


// ─────────────────────────────────────────────
// 2. BUILD LOOKUP INDEX
// ─────────────────────────────────────────────

// Pre-build a lookup map: lowercased term → skill key
const LOOKUP = new Map();
for (const [key, info] of Object.entries(SKILLS_DATABASE)) {
  LOOKUP.set(key.toLowerCase(), key);
  LOOKUP.set(info.display.toLowerCase(), key);
  for (const alias of info.aliases) {
    LOOKUP.set(alias.toLowerCase(), key);
  }
}

// Sort terms by length descending so we match longer phrases first
const SORTED_TERMS = [...LOOKUP.keys()].sort((a, b) => b.length - a.length);

// Pre-compile regular expressions for performance
const TERM_REGEX_CACHE = new Map();

for (const term of SORTED_TERMS) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Use \b (word boundary) for terms that start/end with alphanumeric characters.
  // For special characters (like C++ or .NET), fallback to punctuation boundaries.
  const prefix = /^\w/.test(term) ? '\\b' : '(?:^|[\\s,;|/()\\[\\]•·–—])';
  const suffix = /\w$/.test(term) ? '\\b' : '(?:$|[\\s,;|/()\\[\\]•·–—.:])';
  
  TERM_REGEX_CACHE.set(term, new RegExp(`${prefix}${escaped}${suffix}`));
}

// ─────────────────────────────────────────────
// 3. SKILL EXTRACTION
// ─────────────────────────────────────────────

/**
 * Extracts skills mentioned in the given text.
 * Returns a Set of skill keys (normalized).
 * @param {string} text
 */
function extractSkills(text) {
  if (!text || typeof text !== 'string') return new Set();

  const normalizedText = text
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const found = new Set();

  for (const term of SORTED_TERMS) {
    const skillKey = LOOKUP.get(term);
    if (!skillKey || found.has(skillKey)) continue; // Already matched or invalid



    // Use the pre-compiled RegExp from cache
    const pattern = TERM_REGEX_CACHE.get(term);
    
    if (pattern && pattern.test(normalizedText)) {
      found.add(skillKey);
    }
  }

  return found;
}


// ─────────────────────────────────────────────
// 4. JOB REQUIREMENTS CATEGORIZATION
// ─────────────────────────────────────────────

const REQUIRED_INDICATORS = [
  'required', 'must have', 'must-have', 'essential', 'mandatory',
  'minimum qualifications', 'basic qualifications', 'requirements',
  'you have', 'you bring', 'what you need', 'what we require',
  'key skills', 'core skills', 'necessary',
];

const PREFERRED_INDICATORS = [
  'preferred', 'nice to have', 'nice-to-have', 'bonus', 'plus',
  'preferred qualifications', 'additional qualifications', 'desirable',
  'ideally', 'a plus', 'an advantage', 'good to have', 'not required',
  'optional', 'beneficial',
];

/**
 * Analyzes job text and categorizes extracted skills as 'required' or 'preferred'.
 * Returns { required: Set, preferred: Set, allSkills: Set, yearsMap: Map }
 */
function categorizeJobRequirements(jobText) {
  const allSkills = extractSkills(jobText);
  const required = new Set();
  const preferred = new Set();
  const yearsMap = new Map(); // skill → years mentioned

  const lines = jobText.toLowerCase().split(/[\n.;]+/);
  let currentSection = 'required'; // Default assumption
  let maxRequiredYears = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section headers
    if (REQUIRED_INDICATORS.some(ind => trimmed.includes(ind))) {
      currentSection = 'required';
    } else if (PREFERRED_INDICATORS.some(ind => trimmed.includes(ind))) {
      currentSection = 'preferred';
    }

    // Determine effective section for this specific line (line-level override)
    let effectiveSection = currentSection;
    if (currentSection === 'required' && PREFERRED_INDICATORS.some(ind => trimmed.includes(ind))) {
      effectiveSection = 'preferred';
    } else if (currentSection === 'preferred' && REQUIRED_INDICATORS.some(ind => trimmed.includes(ind))) {
      effectiveSection = 'required';
    }

    // Extract skills from this line
    const lineSkills = extractSkills(trimmed);
    for (const skill of lineSkills) {
      if (effectiveSection === 'preferred') {
        preferred.add(skill);
      } else {
        required.add(skill);
      }
    }

    // Try to extract years of experience
    const yearsMatch = trimmed.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?/);
    if (yearsMatch) {
      const parsedYears = parseInt(yearsMatch[1], 10);
      
      // Track skill-specific years
      for (const skill of lineSkills) {
        yearsMap.set(skill, parsedYears);
      }
      
      // Track overall max years mentioned (cap at 20 to avoid parsing weird numbers)
      if (parsedYears > maxRequiredYears && parsedYears <= 20) {
        maxRequiredYears = parsedYears;
      }
    }
  }

  // Skills found in both → keep as required
  for (const skill of preferred) {
    if (required.has(skill)) {
      preferred.delete(skill);
    }
  }

  return { required, preferred, allSkills, yearsMap, maxRequiredYears };
}

/**
 * Heuristically estimates the user's total years of experience by finding
 * the earliest year mentioned in their resume.
 */
function estimateUserExperience(resumeText) {
  if (!resumeText) return 0;
  
  const currentYear = new Date().getFullYear();
  let textToSearch = resumeText;
  
  // Try to isolate Experience / Work History / Employment section header
  const expMatch = resumeText.match(/(?:^|\n)\s*(?:work\s+)?(?:experience|employment|work\s+history|professional\s+background)\b[\s\S]*?(?=(?:^|\n)\s*(?:education|skills|certifications|projects|summary|languages|awards|references)\b|$)/i);
  if (expMatch && expMatch[0].length > 20) {
    textToSearch = expMatch[0];
  }

  // match years between 1970 and current year
  const yearRegex = /\b(19[7-9]\d|20[0-2]\d)\b/g;
  let matches;
  let minYear = currentYear;
  
  while ((matches = yearRegex.exec(textToSearch)) !== null) {
    const year = parseInt(matches[1], 10);
    if (year <= currentYear && year < minYear) {
      minYear = year;
    }
  }
  
  if (minYear === currentYear) return 0;
  const exp = currentYear - minYear;
  return exp <= 30 ? exp : 0; // Cap at 30 years to ignore birth years or copyright notices
}


// ─────────────────────────────────────────────
// 5. MATCH SCORING
// ─────────────────────────────────────────────

/**
 * Calculates the match score between resume skills and job requirements.
 *
 * @param {Set} resumeSkills - Skills extracted from the resume
 * @param {Object} jobReqs - Output from categorizeJobRequirements()
 * @returns {Object} Match result with score, grade, and categorized skills
 */
function calculateMatchScore(resumeSkills, jobReqs) {
  const { required, preferred, allSkills, yearsMap } = jobReqs;

  // Categorize resume skills against job
  const matchedRequired = new Set();
  const matchedPreferred = new Set();
  const missingRequired = new Set();
  const missingPreferred = new Set();
  const bonusSkills = new Set(); // Skills you have but job didn't ask for

  for (const skill of required) {
    if (resumeSkills.has(skill)) {
      matchedRequired.add(skill);
    } else {
      missingRequired.add(skill);
    }
  }

  for (const skill of preferred) {
    if (resumeSkills.has(skill)) {
      matchedPreferred.add(skill);
    } else {
      missingPreferred.add(skill);
    }
  }

  for (const skill of resumeSkills) {
    if (!allSkills.has(skill)) {
      bonusSkills.add(skill);
    }
  }

  // Filter bonus skills to only those matching a category required/preferred by the job
  const jobCategories = new Set();
  for (const skill of allSkills) {
    const info = getSkillInfo(skill);
    if (info.category && info.category !== 'Other' && info.category !== 'AI Detected') {
      jobCategories.add(info.category);
    }
  }

  const relevantBonusSkills = new Set();
  for (const skill of bonusSkills) {
    const info = getSkillInfo(skill);
    if (jobCategories.size === 0 || jobCategories.has(info.category)) {
      relevantBonusSkills.add(skill);
    }
  }

  // Scoring weights
  const REQUIRED_WEIGHT = 3;
  const PREFERRED_WEIGHT = 1;

  const totalWeight =
    required.size * REQUIRED_WEIGHT +
    preferred.size * PREFERRED_WEIGHT;

  if (totalWeight === 0) {
    return {
      score: 0,
      grade: 'No Skills Found',
      gradeColor: 'gray',
      breakdown: { requiredPct: 0, preferredPct: 0, bonusPoints: 0, text: 'No skills evaluated' },
      matchedRequired,
      matchedPreferred,
      missingRequired,
      missingPreferred,
      bonusSkills: relevantBonusSkills,
      yearsMap,
      totalJobSkills: allSkills.size,
      totalResumeSkills: resumeSkills.size,
      summaryRewrite: { original: "", rewritten: "", reason: "" },
      skillsOrdering: [],
      experienceRewrites: [],
      suggestedKeywords: [],
      tailoringChecklist: [],
    };
  }

  const matchedWeight =
    matchedRequired.size * REQUIRED_WEIGHT +
    matchedPreferred.size * PREFERRED_WEIGHT;

  let score = Math.round((matchedWeight / totalWeight) * 100);

  // Small bonus for having extra relevant skills (max +3)
  const bonusPoints = Math.min(3, Math.floor(relevantBonusSkills.size * 0.5));
  score = Math.min(100, score + bonusPoints);

  const requiredPct = required.size > 0 ? Math.round((matchedRequired.size / required.size) * 100) : 100;
  const preferredPct = preferred.size > 0 ? Math.round((matchedPreferred.size / preferred.size) * 100) : 100;
  const breakdown = {
    requiredPct,
    preferredPct,
    bonusPoints,
    text: `Required match: ${requiredPct}% • Preferred match: ${preferredPct}%${bonusPoints > 0 ? ` • +${bonusPoints} bonus` : ''}`
  };

  // Determine grade
  let grade, gradeColor;
  if (score >= 81) {
    grade = 'Excellent Match';
    gradeColor = '#1a73e8'; // Google Blue
  } else if (score >= 61) {
    grade = 'Good Match';
    gradeColor = '#1e8e3e'; // Google Green
  } else if (score >= 41) {
    grade = 'Fair Match';
    gradeColor = '#e37400'; // Orange
  } else {
    grade = 'Needs Work';
    gradeColor = '#d93025'; // Google Red
  }

  const skillsOrdering = [
    ...Array.from(matchedRequired),
    ...Array.from(matchedPreferred),
    ...Array.from(resumeSkills).filter(s => !matchedRequired.has(s) && !matchedPreferred.has(s))
  ];

  const suggestedKeywords = [
    ...Array.from(missingRequired),
    ...Array.from(missingPreferred)
  ].slice(0, 6);

  const tailoringChecklist = [];
  let chkIdx = 1;
  for (const s of matchedRequired) {
    if (chkIdx <= 3) {
      tailoringChecklist.push({ id: `chk_${chkIdx++}`, text: `Add ${s} to skills section or professional summary`, type: "skill_add", completed: false });
    }
  }
  for (const s of missingRequired) {
    if (chkIdx <= 5) {
      tailoringChecklist.push({ id: `chk_${chkIdx++}`, text: `Add evidence or project achievement using ${s}`, type: "keyword", completed: false });
    }
  }
  if (tailoringChecklist.length === 0) {
    tailoringChecklist.push({ id: `chk_${chkIdx++}`, text: `Review professional summary for job alignment`, type: "summary", completed: false });
  }

  return {
    score,
    grade,
    gradeColor,
    breakdown,
    matchedRequired,
    matchedPreferred,
    missingRequired,
    missingPreferred,
    bonusSkills,
    yearsMap,
    totalJobSkills: allSkills.size,
    totalResumeSkills: resumeSkills.size,
    summaryRewrite: { original: "", rewritten: "", reason: "" },
    skillsOrdering,
    experienceRewrites: [],
    suggestedKeywords,
    tailoringChecklist,
  };
}


// ─────────────────────────────────────────────
// 6. SUGGESTION ENGINE
// ─────────────────────────────────────────────

/**
 * Generates actionable suggestions to improve the resume.
 *
 * @param {Object} matchResult - Output from calculateMatchScore()
 * @returns {Array<{icon: string, title: string, description: string, priority: string}>}
 */
function generateSuggestions(matchResult) {
  const {
    missingRequired,
    missingPreferred,
    matchedRequired,
    matchedPreferred,
    bonusSkills,
    yearsMap,
    score,
  } = matchResult;

  const suggestions = [];

  // Priority 1: Missing required skills
  if (missingRequired.size > 0) {
    const skills = [...missingRequired]
      .map(s => SKILLS_DATABASE[s]?.display || s)
      .slice(0, 5);

    suggestions.push({
      icon: '🎯',
      title: 'Add Required Skills',
      description: skills.length === 1
        ? 'Adding this skill could significantly boost your match.'
        : 'Adding these skills would significantly boost your match.',
      priority: 'high',
      skills: skills,
    });
  }

  // Priority 2: Experience years
  const highYearSkills = [];
  for (const [skill, years] of yearsMap) {
    if (years >= 3 && missingRequired.has(skill)) {
      highYearSkills.push(`${SKILLS_DATABASE[skill]?.display || skill} (${years}+ yrs)`);
    }
  }
  if (highYearSkills.length > 0) {
    suggestions.push({
      icon: '📅',
      title: 'Highlight Experience Duration',
      description: 'Make sure to mention your years of experience with these technologies.',
      priority: 'high',
      skills: highYearSkills,
    });
  }

  // Priority 3: Missing preferred (quick wins)
  if (missingPreferred.size > 0) {
    const skills = [...missingPreferred]
      .map(s => SKILLS_DATABASE[s]?.display || s)
      .slice(0, 4);

    suggestions.push({
      icon: '⭐',
      title: 'Nice-to-Have Skills',
      description: 'These are listed as preferred and will make you stand out from other candidates.',
      priority: 'medium',
      skills: skills,
    });
  }

  // Priority 4: Leverage your bonus skills
  if (bonusSkills.size > 0 && score < 80) {
    const relevant = [...bonusSkills]
      .filter(s => {
        const cat = SKILLS_DATABASE[s]?.category;
        // Check if any job skill is in the same category
        const jobCats = new Set(
          [...missingRequired, ...missingPreferred, ...matchedRequired, ...matchedPreferred]
            .map(js => SKILLS_DATABASE[js]?.category)
            .filter(Boolean)
        );
        return jobCats.has(cat);
      })
      .map(s => SKILLS_DATABASE[s]?.display || s)
      .slice(0, 4);

    if (relevant.length > 0) {
      suggestions.push({
        icon: '💪',
        title: 'Leverage Your Strengths',
        description: 'Highlight these in your cover letter to show breadth of expertise.',
        priority: 'medium',
        skills: relevant,
      });
    }
  }

  // Priority 5: General tips based on score
  if (score < 40) {
    suggestions.push({
      icon: '💡',
      title: 'Consider Upskilling',
      description: 'Your skill set has a significant gap for this role. Consider taking online courses in the required technologies, or look for roles that better match your current skills.',
      priority: 'low',
      skills: [],
    });
  } else if (score >= 80) {
    suggestions.push({
      icon: '🚀',
      title: 'Strong Candidate!',
      description: 'Your skills closely match this role. Focus your resume on quantifiable achievements and project outcomes with these technologies to maximize impact.',
      priority: 'low',
      skills: [],
    });
  }

  // Priority 6: Keyword optimization
  if (matchedRequired.size > 0 || matchedPreferred.size > 0) {
    suggestions.push({
      icon: '🔑',
      title: 'ATS Keyword Optimization',
      description: 'Use the exact terms from the job posting in your resume. Many companies use Applicant Tracking Systems (ATS) that scan for keyword matches.',
      priority: 'low',
      skills: [],
    });
  }

  return suggestions;
}


// ─────────────────────────────────────────────
// 7. UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Gets the display info for a skill key.
 */
function getSkillInfo(skillKey) {
  if (SKILLS_DATABASE[skillKey]) return SKILLS_DATABASE[skillKey];
  if (typeof window !== 'undefined' && window._aiDetectedSkills && window._aiDetectedSkills[skillKey]) {
    return window._aiDetectedSkills[skillKey];
  }
  return { display: skillKey, category: 'Other', aliases: [] };
}

/**
 * Groups skills by category.
 */
function groupByCategory(skillSet) {
  const groups = {};
  for (const skill of skillSet) {
    const info = getSkillInfo(skill);
    if (!groups[info.category]) groups[info.category] = [];
    groups[info.category].push(info.display);
  }
  return groups;
}

/**
 * Full analysis pipeline: takes resume text and job text, returns complete result.
 * Includes Tal-inspired Prioritize vs Pass verdict, strengths, and concerns.
 */
function analyzeMatch(resumeText, jobText) {
  const resumeSkills = extractSkills(resumeText);
  const jobReqs = categorizeJobRequirements(jobText);
  const matchResult = calculateMatchScore(resumeSkills, jobReqs);
  const suggestions = generateSuggestions(matchResult);

  let { score, matchedRequired, matchedPreferred, missingRequired, missingPreferred, yearsMap } = matchResult;

  // ── Overall Experience Gap ──
  const estimatedUserExp = estimateUserExperience(resumeText);
  const maxRequiredExp = jobReqs.maxRequiredYears || 0;
  let hasExperienceGap = false;
  
  if (maxRequiredExp > 0 && estimatedUserExp < maxRequiredExp - 1) {
    hasExperienceGap = true;
    // Penalty for severe experience gap
    score = Math.max(0, score - 15);
  }

  // ── Tal-style Verdict & 10-Point Score ──
  const score10 = (score / 10).toFixed(score % 10 === 0 ? 0 : 1);

  let verdictTitle = 'Prioritise this 🔥';
  let verdictBadge = 'PRIORITISE';
  let verdictColor = '#107c41'; // Green
  let verdictIcon = 'local_fire_department';
  let confidenceLabel = 'High Confidence';
  let honestTake = 'This is right in your lane. Strong role, strong tech stack alignment, and moves you forward.';

  if (score < 60) {
    verdictTitle = 'Pass on this 🚫';
    verdictBadge = 'PASS';
    verdictColor = '#d93025'; // Red
    verdictIcon = 'cancel';
    confidenceLabel = 'Low Confidence';
    honestTake = 'Significant skill gaps. You are missing critical required stack — consider passing or tailoring first.';
  } else if (score < 75) {
    verdictTitle = 'Consider this ⚡';
    verdictBadge = 'CONSIDER';
    verdictColor = '#e37400'; // Orange
    verdictIcon = 'bolt';
    confidenceLabel = 'Moderate Confidence';
    honestTake = 'Fair alignment with your background. Tailoring 2-3 key missing skills will boost your response rate.';
  }

  // ── Tal Strengths List ──
  const strengthsList = [];
  const topMatched = [...matchedRequired, ...matchedPreferred]
    .map(s => getSkillInfo(s).display)
    .slice(0, 4);

  if (topMatched.length > 0) {
    strengthsList.push(`Direct match on key stack: ${topMatched.join(', ')}`);
  }

  if (matchedRequired.size > 0) {
    strengthsList.push(`Covers ${matchedRequired.size} core mandatory requirement${matchedRequired.size > 1 ? 's' : ''}`);
  }

  strengthsList.push('Solid brand & technical signal for your next career move');

  // ── Tal Concerns List ──
  const concernsList = [];
  if (missingRequired.size > 0) {
    const missingList = [...missingRequired].map(s => getSkillInfo(s).display).slice(0, 4);
    concernsList.push(`Missing core skills: ${missingList.join(', ')}`);
  }

  const highExpGaps = [];
  for (const [skill, yrs] of yearsMap) {
    if (yrs >= 3 && missingRequired.has(skill)) {
      highExpGaps.push(`${getSkillInfo(skill).display} (${yrs}+ yrs)`);
    }
  }
  if (highExpGaps.length > 0) {
    concernsList.push(`Experience duration gap: ${highExpGaps.join(', ')}`);
  }

  if (hasExperienceGap) {
    concernsList.push(`Requires ${maxRequiredExp}+ years of experience (You have ~${estimatedUserExp})`);
  }

  if (concernsList.length === 0) {
    concernsList.push('Fast-paced team — expect high expectations');
  }

  // ── NextRaise Cold Email Generator ──
  const topSkillsStr = topMatched.length > 0 ? topMatched.join(', ') : 'software engineering';
  const coldEmailSubject = 'Application & Referral Inquiry for [Role Title]';
  const coldEmailBody = `Hi [Hiring Manager / Recruiter Name],

I noticed your open position for [Role Title] and wanted to reach out directly.

Given my background with ${topSkillsStr}, I believe I could add immediate value to your engineering team. I've attached my resume for your review.

Would you be open to a brief 5-minute chat this week to see if my experience aligns with your team's goals?

Best regards,
[Your Name]
[Your Phone / LinkedIn]`;

  return {
    ...matchResult,
    score10,
    verdictTitle,
    verdictBadge,
    verdictColor,
    verdictIcon,
    confidenceLabel,
    honestTake,
    strengthsList,
    concernsList,
    strengths: strengthsList,
    concerns: concernsList,
    coldEmailSubject,
    coldEmailBody,
    suggestions,
    bulletRewrites: [],
    resumeSkillsList: [...resumeSkills].map(s => getSkillInfo(s)),
    jobTitle: '',
  };
}
