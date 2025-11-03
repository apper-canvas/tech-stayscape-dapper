import { Link } from 'react-router-dom'
import ApperIcon from '@/components/ApperIcon'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <ApperIcon name="AlertTriangle" className="w-24 h-24 text-accent-500 mx-auto" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 transition-colors"
        >
          <ApperIcon name="Home" className="w-5 h-5 mr-2" />
          Go Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound