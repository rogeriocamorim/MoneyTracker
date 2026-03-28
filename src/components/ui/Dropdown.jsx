import { Fragment } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'

export default function Dropdown({ trigger, items = [], align = 'right', className = '' }) {
  const alignClass = align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      {trigger ? (
        <MenuButton as={Fragment}>{trigger}</MenuButton>
      ) : (
        <MenuButton className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer">
          Options
          <ChevronDown className="w-4 h-4" />
        </MenuButton>
      )}

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems
          className={`
            absolute z-50 mt-1 w-56 bg-white rounded-xl border border-slate-200
            shadow-lg shadow-slate-200/50 py-1 focus:outline-none
            ${alignClass}
          `}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1 border-t border-slate-100" />
            }

            return (
              <MenuItem key={index}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`
                      flex items-center gap-2.5 w-full px-3 py-2 text-sm cursor-pointer
                      ${active ? 'bg-slate-50' : ''}
                      ${item.danger ? 'text-danger-600' : 'text-slate-700'}
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                    {item.label}
                  </button>
                )}
              </MenuItem>
            )
          })}
        </MenuItems>
      </Transition>
    </Menu>
  )
}
