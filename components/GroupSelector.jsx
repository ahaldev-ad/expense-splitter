import React, { useState, useRef, useEffect } from 'react';
import { Layers, Plus, Trash2, Globe, Tent, X, Check } from 'lucide-react';

export const GroupSelector = ({ 
  groups, 
  activeGroupId, 
  onSelectGroup, 
  onCreateGroup,
  onDeleteGroup
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreating(false);
      // Scroll to end (rough approximation)
      setTimeout(() => {
          if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: 'smooth' });
          }
      }, 100);
    }
  };

  const cancelCreate = () => {
      setIsCreating(false);
      setNewGroupName('');
  };

  return (
    <div className="w-full border-t border-olive-100 bg-olive-50/30">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-olive-800 text-[10px] font-bold uppercase tracking-widest min-w-fit opacity-70">
                <Layers size={12} />
                <span>Context</span>
            </div>
            
            {/* Scrollable Container */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-0.5 touch-pan-x"
            >
                {/* 'All' Option */}
                <button
                    onClick={() => onSelectGroup('all')}
                    className={`
                        flex-none flex items-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border select-none
                        ${activeGroupId === 'all' 
                            ? 'bg-olive-800 text-white border-olive-800 shadow-sm ring-1 ring-olive-800/20' 
                            : 'bg-white text-olive-600 border-olive-200 hover:border-olive-300 hover:bg-olive-50'
                        }
                    `}
                >
                    <Globe size={13} />
                    All
                </button>

                {/* Group Items */}
                {groups.map(g => {
                    const isActive = activeGroupId === g.id;
                    const isSystem = g.id === 'general';

                    return (
                        <div key={g.id} className="relative group/item flex-none">
                            <button
                                onClick={() => onSelectGroup(g.id)}
                                className={`
                                    flex items-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap border select-none
                                    ${isActive 
                                        ? 'bg-olive-800 text-white border-olive-800 shadow-sm ring-1 ring-olive-800/20 pr-7' 
                                        : 'bg-white text-olive-600 border-olive-200 hover:border-olive-300 hover:bg-olive-50'
                                    }
                                `}
                            >
                                <Tent size={13} />
                                {g.name}
                            </button>
                            
                            {/* Delete Button (Only visible on Active Custom Groups) */}
                            {isActive && !isSystem && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete group "${g.name}" and all its expenses?`)) {
                                            onDeleteGroup(g.id);
                                        }
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 sm:p-1 text-olive-300 hover:text-red-200 hover:bg-red-500/20 rounded transition-colors"
                                    title="Delete Group"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    );
                })}

                {/* Create New Button / Form */}
                {isCreating ? (
                    <form onSubmit={handleCreate} className="flex-none flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && cancelCreate()}
                            placeholder="Name..."
                            className="w-24 px-2 py-1.5 text-xs bg-white border border-olive-300 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!newGroupName.trim()}
                            className="bg-olive-700 text-white p-2 sm:p-1.5 rounded-md hover:bg-olive-800 disabled:opacity-50 transition-colors"
                        >
                            <Check size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={cancelCreate}
                            className="bg-white text-olive-500 border border-olive-200 p-2 sm:p-1.5 rounded-md hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex-none flex items-center gap-1 px-4 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-olive-500 border border-dashed border-olive-300 hover:border-olive-500 hover:text-olive-800 hover:bg-white transition-all whitespace-nowrap opacity-80 hover:opacity-100"
                    >
                        <Plus size={13} />
                        <span>New</span>
                    </button>
                )}
            </div>
      </div>
    </div>
  );
};