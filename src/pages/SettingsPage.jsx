import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Plus, X, Save, Key, Cpu, MessageSquare } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const TopicManager = ({ title, topics, onAdd, onRemove, icon: Icon, color }) => {
  const [newTopic, setNewTopic] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTopic.trim()) {
      onAdd(newTopic.trim());
      setNewTopic('');
    }
  };

  return (
    <div className="glass-card mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {topics.map((topic, index) => (
          <span 
            key={index}
            className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-text-secondary group hover:border-white/20 transition-all"
          >
            {topic}
            <button 
              onClick={() => onRemove(topic)}
              className="text-text-muted hover:text-danger"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Add new topic..."
          className="input flex-1"
        />
        <button type="submit" className="btn btn-secondary px-4">
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
};

const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 pt-16 pb-32">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">Settings</h1>
          <p className="text-text-secondary">Configure your preferences and API keys.</p>
        </div>
        {isSaved && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-success font-medium bg-success/10 px-4 py-2 rounded-lg border border-success/20"
          >
            <Save size={18} />
            Saved!
          </motion.div>
        )}
      </div>

      <section className="glass-card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-warning/10 text-warning rounded-lg">
            <Key size={20} />
          </div>
          <h3 className="text-xl font-bold">API Configuration</h3>
        </div>
        
        <div className="relative">
          <label className="label">Groq API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={settings.groqApiKey}
              onChange={(e) => updateSettings({ groqApiKey: e.target.value })}
              placeholder="gsk_..."
              className="input pr-12"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Your key is stored locally in your browser and never sent to any server except Groq.
          </p>
        </div>
      </section>

      <TopicManager
        title="Technical Topics"
        topics={settings.technicalTopics}
        icon={Cpu}
        color="bg-accent-primary/10 text-accent-primary"
        onAdd={(topic) => updateSettings({ technicalTopics: [...settings.technicalTopics, topic] })}
        onRemove={(topic) => updateSettings({ technicalTopics: settings.technicalTopics.filter(t => t !== topic) })}
      />

      <TopicManager
        title="General Topics"
        topics={settings.generalTopics}
        icon={MessageSquare}
        color="bg-accent-secondary/10 text-accent-secondary"
        onAdd={(topic) => updateSettings({ generalTopics: [...settings.generalTopics, topic] })}
        onRemove={(topic) => updateSettings({ generalTopics: settings.generalTopics.filter(t => t !== topic) })}
      />

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary px-8">
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
