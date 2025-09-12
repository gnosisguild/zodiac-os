interface JSONDownloadProps {
  data: string
  filename: string
}

export const JSONDownload = ({ data, filename }: JSONDownloadProps) => {
  const handleDownload = () => {
    try {
      // Parse the data string back to object and re-stringify for proper formatting
      const jsonData = JSON.parse(data)
      const formattedJson = JSON.stringify(jsonData, null, 2)

      // Create blob with proper MIME type
      const blob = new Blob([formattedJson], { type: 'application/json' })

      // Create download URL
      const url = URL.createObjectURL(blob)

      // Create and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading JSON file:', error)
      alert('Error downloading file. Please try again.')
    }
  }

  return (
    <div className="animate-fade-in inline-block max-w-full rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Transaction File Ready
          </h3>
          <p className="text-sm text-gray-600">
            Safe Transaction Builder compatible JSON file
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 rounded-lg bg-gray-900 px-4 py-2 text-white shadow-sm transition-colors hover:bg-gray-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Download JSON</span>
        </button>
      </div>
    </div>
  )
}
