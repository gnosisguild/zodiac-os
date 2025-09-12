export const ScrollToBottom = ({
  visible,
  onClick,
}: {
  visible: boolean
  onClick: () => void
}) => {
  return (
    <>
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 via-white/40 to-transparent transition-opacity duration-200 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <button
        onClick={onClick}
        className={`absolute bottom-4 left-1/2 flex h-8 w-8 -translate-x-1/2 transform items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all duration-200 ease-out hover:bg-gray-700 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
    </>
  )
}
