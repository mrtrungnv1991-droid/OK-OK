import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Copy, 
  Check, 
  RefreshCw, 
  Code, 
  Terminal, 
  CheckCircle2,
  FileText,
  Key
} from 'lucide-react';
import { useTranslation } from '../i18n';

interface KeyToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyToolsModal: React.FC<KeyToolsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'formatter' | 'steam_validator' | 'uid_checker'>('formatter');
  const [rawText, setRawText] = useState('');
  const [outputFormat, setOutputFormat] = useState('user_pass');
  const [formattedOutput, setFormattedOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // Steam Key Format checker
  const [steamInput, setSteamInput] = useState('');
  const [steamResults, setSteamResults] = useState<{ key: string; valid: boolean }[]>([]);

  // UID Game ping tool
  const [uidInput, setUidInput] = useState('849201948');
  const [selectedGame, setSelectedGame] = useState('Genshin Impact');
  const [uidResult, setUidResult] = useState<{ nickname: string; server: string; status: string } | null>(null);
  const [isCheckingUid, setIsCheckingUid] = useState(false);

  const handleFormatAccounts = () => {
    if (!rawText.trim()) return;
    const lines = rawText.trim().split('\n');
    const processed = lines.map((line) => {
      const parts = line.split(/[|:\t,]/).map((p) => p.trim());
      if (outputFormat === 'user_pass') {
        return `${parts[0] || ''}|${parts[1] || ''}`;
      } else if (outputFormat === 'user_pass_2fa') {
        return `${parts[0] || ''}|${parts[1] || ''}|${parts[2] || ''}`;
      } else if (outputFormat === 'json') {
        return JSON.stringify({ user: parts[0] || '', pass: parts[1] || '', secret_2fa: parts[2] || '' });
      }
      return line;
    });
    setFormattedOutput(processed.join('\n'));
  };

  const handleValidateSteamKeys = () => {
    if (!steamInput.trim()) return;
    const lines = steamInput.trim().split('\n');
    const steamPattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;
    const results = lines.map((k) => ({
      key: k.trim(),
      valid: steamPattern.test(k.trim())
    }));
    setSteamResults(results);
  };

  const handleCheckUid = () => {
    setIsCheckingUid(true);
    setUidResult(null);
    setTimeout(() => {
      setIsCheckingUid(false);
      setUidResult({
        nickname: 'CyberGamer_VN',
        server: 'Asia Server',
        status: 'Online & Ready'
      });
    }, 1200);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#090c15] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1222] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                {t('nav.key_tools')}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('nav.utilities')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('formatter')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'formatter'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Format Key/Acc
          </button>
          <button
            onClick={() => setActiveTab('steam_validator')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'steam_validator'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Check Format Steam Key
          </button>
          <button
            onClick={() => setActiveTab('uid_checker')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'uid_checker'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ping UID & Game
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'formatter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300">{t('common.description')}:</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Format:</span>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 rounded px-2 py-1"
                  >
                    <option value="user_pass">User|Pass</option>
                    <option value="user_pass_2fa">User|Pass|2FA</option>
                    <option value="json">JSON Object Array</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="user1|pass1|2fa_code|mail@test.com&#10;user2:pass2:2fa_code2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
              />

              <button
                onClick={handleFormatAccounts}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase cursor-pointer"
              >
                {t('common.confirm')}
              </button>

              {formattedOutput && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>{t('common.info')}:</span>
                    <button
                      onClick={handleCopyOutput}
                      className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    readOnly
                    value={formattedOutput}
                    className="w-full bg-black/70 border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-400"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'steam_validator' && (
            <div className="space-y-4">
              <label className="text-xs font-mono text-slate-300">
                Steam Key (XXXXX-XXXXX-XXXXX):
              </label>
              <textarea
                rows={4}
                value={steamInput}
                onChange={(e) => setSteamInput(e.target.value)}
                placeholder="ABCDE-12345-FGHIJ&#10;INVALID-KEY-123"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white"
              />
              <button
                onClick={handleValidateSteamKeys}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase cursor-pointer"
              >
                {t('common.confirm')}
              </button>

              {steamResults.length > 0 && (
                <div className="space-y-2">
                  {steamResults.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <code className="text-slate-200">{r.key}</code>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.valid
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-950 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {r.valid ? t('common.success') : t('common.error')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'uid_checker' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300">{t('topup.select_game')}:</label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-white mt-1"
                  >
                    <option value="Genshin Impact">Genshin Impact (Hoyoverse)</option>
                    <option value="Liên Quân Mobile">Liên Quân Mobile (Garena)</option>
                    <option value="Valorant">Valorant (Riot Games)</option>
                    <option value="Free Fire">Free Fire (Garena)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300">{t('topup.enter_uid')}:</label>
                  <input
                    type="text"
                    value={uidInput}
                    onChange={(e) => setUidInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-white mt-1"
                  />
                </div>
              </div>

              <button
                onClick={handleCheckUid}
                disabled={isCheckingUid}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingUid ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <span>{t('common.confirm')}</span>
                )}
              </button>

              {uidResult && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('common.success')}</span>
                  </div>
                  <div className="text-slate-300">{t('common.description')}: <strong className="text-white">{uidResult.nickname}</strong></div>
                  <div className="text-slate-300">{t('topup.enter_server')}: <strong className="text-white">{uidResult.server}</strong></div>
                  <div className="text-slate-300">{t('common.status')}: <span className="text-cyan-300">{uidResult.status}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
