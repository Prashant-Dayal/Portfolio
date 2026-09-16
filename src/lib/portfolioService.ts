import { supabase } from '@/lib/supabase'

export const fetchProjects = async () => {
  try {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', {
        ascending: true,
      })

    return data || []
  } catch {
    return []
  }
}

export const fetchCertificates = async () => {
  try {
    const { data } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', {
        ascending: true,
      })

    return data || []
  } catch {
    return []
  }
}

export const fetchTechStacks = async () => {
  try {
    const { data } = await supabase
      .from('tech_stack')
      .select('*')
      .order('created_at', {
        ascending: true,
      })

    return data || []
  } catch {
    return []
  }
}