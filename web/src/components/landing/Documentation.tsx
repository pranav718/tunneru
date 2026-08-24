'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { SlideUpText } from './SlideUpText';
import { SpotlightCard } from './SpotlightCard';
import { InteractiveLink } from './InteractiveLink';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative group rounded-xl border border-[var(--border-normal)] bg-[var(--card-alt)] overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--card-panel)]">
        <span className="text-[11px] font-mono text-[var(--text-dim)] lowercase">{language}</span>
        <button
          onClick={handleCopy}
          aria-label="copy code snippet"
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono text-[var(--text-dim)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition-colors active:scale-95 cursor-pointer"
        >
          {copied ? <Check size={12} className="text-[var(--teal)]" /> : <Copy size={12} />}
          <span>{copied ? 'copied' : 'copy'}</span>
        </button>
      </div>
      <pre className="p-4 text-[13px] font-mono text-[var(--text-primary)] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'auth' | 'inspect' | 'selfhost' | 'cli'>('quickstart');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash === 'self-host' || hash === 'selfhost') {
        setActiveTab('selfhost');
      } else if (hash === 'auth' || hash === 'authtoken') {
        setActiveTab('auth');
      } else if (hash === 'inspect' || hash === 'inspector') {
        setActiveTab('inspect');
      } else if (hash === 'cli' || hash === 'flags') {
        setActiveTab('cli');
      } else if (hash === 'quickstart') {
        setActiveTab('quickstart');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const tabs = [
    { id: 'quickstart', label: 'quickstart' },
    { id: 'auth', label: 'auth & tokens' },
    { id: 'inspect', label: 'inspection & replay' },
    { id: 'selfhost', label: 'self-host' },
    { id: 'cli', label: 'cli reference' },
  ] as const;

  return (
    <section id="docs" className="border-t border-[var(--border-subtle)] py-24 bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[13px] font-mono text-[var(--teal)] tracking-wider">
            developer guide & reference
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-3">
            <SlideUpText text="everything you need to get started" />
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
            install the client, manage tokens, inspect live traffic, or run your own server.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-mono transition-all duration-150 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--card-alt)] border border-[var(--border-accent)] text-[var(--teal)] shadow-sm'
                    : 'bg-transparent border border-transparent text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                }`}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <SpotlightCard className="max-w-4xl mx-auto rounded-2xl">
          {activeTab === 'quickstart' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">1. install the client</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  download and install the prebuilt static binary for macos, linux, or windows.
                </p>
                <CodeBlock code="curl -fsSL https://raw.githubusercontent.com/pranav718/tunneru/main/install.sh | sh" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">2. expose a local port</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  run your local application (e.g. next.js, fastApi, flask, rails) on port 3000, then start the tunnel.
                </p>
                <CodeBlock code="tunneru 3000" />
                <p className="text-[13px] text-[var(--text-dim)] mt-2 font-mono">
                  tunneru assigns a random public subdomain (e.g. https://frost-729.tunneru.knightkun.codes) and starts the live tui.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">3. request a custom subdomain</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-3">
                  specify a desired subdomain if available on the server.
                </p>
                <CodeBlock code="tunneru 3000 --subdomain myapp" />
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">authentication tokens</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  tokens allow servers to restrict tunnel creation and reserve static subdomains for team members.
                </p>
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">save your token permanently</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  stores the credentials locally in ~/.tunneru/config.json so you never have to pass it per command.
                </p>
                <CodeBlock code="tunneru authtoken sec_9a8f2c3e4d5b6a" />
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">pass token via flag</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  useful in ci/cd pipelines, github actions, and ephemeral test environments.
                </p>
                <CodeBlock code="tunneru 3000 --authtoken $TUNNERU_AUTH_TOKEN --subdomain staging" />
              </div>
            </div>
          )}

          {activeTab === 'inspect' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">request inspection & replay</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  the client spins up a zero-overhead local web inspector at http://localhost:4040 alongside the terminal tui.
                </p>
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">live web dashboard</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  open your browser to inspect full headers, query parameters, multipart bodies, and response status codes.
                </p>
                <CodeBlock code="open http://localhost:4040" />
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">instant request replay via curl</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  replay any captured incoming webhook directly against your local server without re-triggering external services.
                </p>
                <CodeBlock code="curl -X POST http://localhost:4040/api/requests/req_01h8x/replay" />
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">clear request history</h4>
                <CodeBlock code="curl -X DELETE http://localhost:4040/api/requests" />
              </div>
            </div>
          )}

          {activeTab === 'selfhost' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">self-host your own server</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  deploy the lightweight tunneru-server binary on any vps, docker container, or kubernetes cluster.
                </p>
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">run with docker</h4>
                <CodeBlock
                  language="bash"
                  code="docker run -d \
  -p 7001:7001 \
  -p 8080:8080 \
  --name tunneru-server \
  ghcr.io/pranav718/tunneru-server:latest \
  --domain mycompany.dev \
  --auth-tokens dev_token,team_token:internal"
                />
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">caddy reverse proxy configuration</h4>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  sample caddyfile for automatic wildcard let&apos;s encrypt tls certificates.
                </p>
                <CodeBlock
                  language="caddyfile"
                  code="*.mycompany.dev {
  tls {
    dns cloudflare {env.CLOUDFLARE_API_TOKEN}
  }
  reverse_proxy localhost:8080
}"
                />
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-[var(--text-primary)] mb-2">connect client to your self-hosted server</h4>
                <CodeBlock code="tunneru 3000 --server tunnel.mycompany.dev:7001 --subdomain test" />
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">cli flags & options</h3>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  complete command line argument reference for tunneru client and server binaries.
                </p>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold text-[var(--teal)] font-mono mb-3">tunneru (client)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] text-[var(--text-dim)]">
                        <th className="py-2.5 px-3">flag</th>
                        <th className="py-2.5 px-3">type</th>
                        <th className="py-2.5 px-3">default</th>
                        <th className="py-2.5 px-3">description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)] font-bold">port</td>
                        <td className="py-2.5 px-3">int (arg)</td>
                        <td className="py-2.5 px-3">required</td>
                        <td className="py-2.5 px-3">local port to expose (e.g. 3000, 8080)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--server</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;localhost:7001&quot;</td>
                        <td className="py-2.5 px-3">tunneru server control address</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--subdomain</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;&quot;</td>
                        <td className="py-2.5 px-3">requested custom subdomain name</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--authtoken</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;&quot;</td>
                        <td className="py-2.5 px-3">authentication token for protected servers</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4">
                <h4 className="text-[14px] font-semibold text-[var(--blush)] font-mono mb-3">tunneru-server</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] text-[var(--text-dim)]">
                        <th className="py-2.5 px-3">flag</th>
                        <th className="py-2.5 px-3">type</th>
                        <th className="py-2.5 px-3">default</th>
                        <th className="py-2.5 px-3">description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--control-addr</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;:7001&quot;</td>
                        <td className="py-2.5 px-3">listening address for tcp multiplexer control</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--proxy-addr</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;:8080&quot;</td>
                        <td className="py-2.5 px-3">listening address for incoming public http traffic</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--domain</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;tunneru.knightkun.codes&quot;</td>
                        <td className="py-2.5 px-3">base domain for client subdomains</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--auth-tokens</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;&quot;</td>
                        <td className="py-2.5 px-3">comma-separated list of valid tokens</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 text-[var(--text-primary)]">--auth-file</td>
                        <td className="py-2.5 px-3">string</td>
                        <td className="py-2.5 px-3">&quot;&quot;</td>
                        <td className="py-2.5 px-3">path to json file mapping tokens to subdomains</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </SpotlightCard>

        <div className="mt-10 text-center">
          <InteractiveLink
            href="https://github.com/pranav718/tunneru#readme"
            label="read full protocol spec & architecture in github readme"
            external={true}
          />
        </div>
      </div>
    </section>
  );
};
