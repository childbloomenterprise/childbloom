import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) { return twMerge(clsx(inputs)) }

/**
 * MotionButton — an expanding-circle CTA button.
 * On hover the brand-color circle grows to fill the pill, shifting the label to white.
 * Props:
 *   label    — button text
 *   variant  — 'primary' (forest green) | 'secondary' (terracotta)
 *   classes  — extra Tailwind classes to merge
 *   onClick  — click handler
 */
export default function MotionButton({ label, variant = 'primary', classes, onClick }) {
  const circleColor = variant === 'secondary' ? 'bg-terracotta-400' : 'bg-forest-600'

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative h-auto w-52 cursor-pointer rounded-full p-1 outline-none border-none bg-white shadow-card',
        classes
      )}
    >
      {/* expanding circle */}
      <span
        className={cn(
          'block h-12 w-12 overflow-hidden rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full',
          circleColor
        )}
        aria-hidden='true'
      />

      {/* arrow icon — stays inside circle, nudges right on hover */}
      <div className='absolute top-1/2 left-4 -translate-y-1/2 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[0.35rem]'>
        <ArrowRight className='text-white size-6' />
      </div>

      {/* label — fades to white as circle expands */}
      <span className='absolute top-1/2 left-1/2 ml-4 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-base font-semibold tracking-tight transition-colors duration-500 font-sans text-forest-900 group-hover:text-white'>
        {label}
      </span>
    </button>
  )
}
