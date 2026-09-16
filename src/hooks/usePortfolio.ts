'use client'

import { useEffect, useState } from 'react'
import {
  fetchCertificates,
  fetchProjects,
  fetchTechStacks,
} from '@/lib/portfolioService'

type PortfolioItem = {
  id: number
  title: string
  description: string
  name?: string
  image_url?: string | null
  live_url?: string | null
  logo_url?: string | null
  [key: string]: unknown
}

export default function usePortfolio() {
  const [projects, setProjects] = useState<PortfolioItem[]>([])
  const [certificates, setCertificates] = useState<PortfolioItem[]>([])
  const [techStacks, setTechStacks] = useState<PortfolioItem[]>([])

  const [loading, setLoading] = useState(true)

  const loadPortfolio = async () => {
    try {
      const cachedProjects = sessionStorage.getItem('portfolioProjects')
      const cachedCertificates = sessionStorage.getItem('portfolioCertificates')
      const cachedTechStacks = sessionStorage.getItem('portfolioTechStacks')

      if (cachedProjects) {
        setProjects(JSON.parse(cachedProjects))
      }

      if (cachedCertificates) {
        setCertificates(JSON.parse(cachedCertificates))
      }

      if (cachedTechStacks) {
        setTechStacks(JSON.parse(cachedTechStacks))
      }

      const [projectsData, certificatesData, techStacksData] = await Promise.all([
        fetchProjects(),
        fetchCertificates(),
        fetchTechStacks(),
      ])

      setProjects(projectsData || [])
      setCertificates(certificatesData || [])
      setTechStacks(techStacksData || [])

      sessionStorage.setItem('portfolioProjects', JSON.stringify(projectsData || []))
      sessionStorage.setItem('portfolioCertificates', JSON.stringify(certificatesData || []))
      sessionStorage.setItem('portfolioTechStacks', JSON.stringify(techStacksData || []))
    } catch {
      setProjects([])
      setCertificates([])
      setTechStacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPortfolio()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  return {
    projects,
    certificates,
    techStacks,
    loading,
  }
}