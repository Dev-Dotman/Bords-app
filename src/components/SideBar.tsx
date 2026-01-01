import { useState } from 'react'
import {
  Layers, FileImage, CheckSquare, Calendar, Tags,
  Users, History, Command, Brain, Workflow
} from 'lucide-react'
import { useThemeStore } from '../store/themeStore'

const toolItems = [
  { id: 1, icon: Layers, label: "Nested Pages", description: "Create page hierarchies" },
  { id: 2, icon: FileImage, label: "Rich Media", description: "Add images & files" },
  { id: 3, icon: CheckSquare, label: "Checklists", description: "Interactive to-dos" },
  { id: 4, icon: Calendar, label: "Timeline", description: "Schedule tasks" },
  { id: 5, icon: Tags, label: "Tags", description: "Organize & filter" },
  { id: 6, icon: Users, label: "Collaborate", description: "Multi-user editing" },
  { id: 7, icon: History, label: "History", description: "Track changes" },
  { id: 8, icon: Command, label: "Commands", description: "Quick actions" },
  { id: 9, icon: Brain, label: "AI Helper", description: "Smart suggestions" },
  { id: 10, icon: Workflow, label: "Automations", description: "Custom triggers" }
]

export function SideBar() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const isDark = useThemeStore((state) => state.isDark)

  return (
    <div className="fixed right-4 top-[7.5vh] z-40 h-[85vh]">
      <div className={`flex flex-col h-full backdrop-blur-xl border shadow-lg rounded-2xl w-16
        ${isDark 
          ? 'bg-zinc-800/90 border-zinc-700/50' 
          : 'bg-white/90 border-zinc-200/50'}
        transition-colors duration-200`}>
        <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center gap-4">
          {toolItems.map((item) => (
            <button
              key={item.id}
              className="group relative flex-shrink-0 transition-all duration-200 p-1 w-full"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className={`
                flex items-center justify-center
                ${hoveredItem === item.id ? 'scale-110' : 'hover:scale-105'}
                transition-all duration-200
              `}>
                <item.icon 
                  className={`w-6 h-6 transition-colors
                    ${isDark 
                      ? 'text-zinc-400 group-hover:text-zinc-200' 
                      : 'text-zinc-600 group-hover:text-zinc-900'}`}
                  strokeWidth={1.5}
                />
              </div>
              <div 
                style={{ position: 'fixed', right: '88px' }}
                className={`
                  top-auto translate-y-[-50%]
                  bg-zinc-800 text-white px-3 py-2 rounded-lg
                  text-xs min-w-[200px] pointer-events-none
                  transition-all duration-200 ease-out shadow-lg
                  z-[100]
                  ${hoveredItem === item.id 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-2'}
                `}
              >
                <div className="font-medium mb-1">{item.label}</div>
                <div className="text-zinc-400 text-[10px] leading-relaxed">
                  {item.description}
                </div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-[7px]
                     border-[7px] border-transparent border-l-zinc-800"/>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
