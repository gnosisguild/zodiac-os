import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
// import { AnimatePresence, motion } from "framer-motion";

export function AgentMessageCopy({ copied }: { copied: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative h-5 w-5">
        <ClipboardDocumentIcon
          className={`absolute inset-0 h-5 w-5 transition-opacity duration-150 ease-out ${
            copied ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <CheckIcon
          className={`absolute inset-0 h-5 w-5 text-gray-700 transition-opacity duration-150 ease-out ${
            copied ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {/* Alternative Motion animation w/ scale & blur */}
        {/* <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copied ? "check" : "copy"}
              initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="absolute inset-0"
            >
              {copied ? (
                <CheckIcon className="w-5 h-5 text-gray-700" />
              ) : (
                <ClipboardDocumentIcon className="w-5 h-5" />
              )}
            </motion.span>
          </AnimatePresence> */}
      </span>
      <span className="relative">
        <span
          className={`transition-opacity duration-150 ease-out ${
            copied
              ? 'pointer-events-none absolute left-0 top-0 opacity-0'
              : 'relative opacity-100'
          }`}
        >
          <span className="text-md font-semibold">Copy</span>
        </span>
        <span
          className={`transition-opacity duration-150 ease-out ${
            copied
              ? 'relative opacity-100'
              : 'pointer-events-none absolute left-0 top-0 opacity-0'
          }`}
        >
          <span className="text-md font-semibold text-gray-700">Copied</span>
        </span>
      </span>
    </span>
  )
}
