'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  ExternalLink,
  BookOpen,
  FlaskConical,
  Globe,
  Newspaper,
} from 'lucide-react'

type Database = {
  name: string
  description: string
  url: string
  tags: string[]
}

type Category = {
  title: string
  description: string
  icon: React.ReactNode
  databases: Database[]
}

const categories: Category[] = [
  {
    title: 'Evidence Synthesis & Biomedical Databases',
    description: 'Major biomedical and multidisciplinary research databases for systematic reviews and evidence synthesis.',
    icon: <BookOpen className="h-5 w-5" />,
    databases: [
      {
        name: 'Cochrane Library (CDSR & CENTRAL)',
        description: 'Gold-standard source for systematic reviews and the largest register of controlled trials worldwide.',
        url: 'https://www.cochranelibrary.com/',
        tags: ['systematic reviews', 'controlled trials', 'evidence synthesis'],
      },
      {
        name: 'Embase',
        description: 'Biomedical and pharmacological database with strong coverage of drug research, pharmacology, and international journals.',
        url: 'https://www.embase.com/',
        tags: ['pharmacology', 'biomedical', 'drug research'],
      },
      {
        name: 'AMED (Allied and Complementary Medicine Database)',
        description: 'Covers complementary medicine, physiotherapy, occupational therapy, and palliative care literature.',
        url: 'https://www.ebsco.com/products/research-databases/amed',
        tags: ['complementary medicine', 'physiotherapy', 'palliative care'],
      },
      {
        name: 'CINAHL',
        description: 'Comprehensive index of nursing and allied health literature, covering journals, books, and conference proceedings.',
        url: 'https://www.ebsco.com/products/research-databases/cinahl-database',
        tags: ['nursing', 'allied health', 'healthcare'],
      },
      {
        name: 'Web of Science',
        description: 'Multidisciplinary citation database providing citation tracking, impact metrics, and broad journal coverage.',
        url: 'https://www.webofscience.com/',
        tags: ['citation tracking', 'multidisciplinary', 'impact metrics'],
      },
      {
        name: 'Scopus',
        description: 'Large abstract and citation database covering scientific journals, books, and conference proceedings worldwide.',
        url: 'https://www.scopus.com/',
        tags: ['citations', 'abstracts', 'multidisciplinary'],
      },
      {
        name: 'Global Index Medicus',
        description: 'WHO portal providing access to biomedical and public health literature from low- and middle-income countries.',
        url: 'https://www.globalindexmedicus.net/',
        tags: ['WHO', 'global health', 'low-income countries'],
      },
    ],
  },
  {
    title: 'Clinical Trial Registries',
    description: 'Official registries for tracking ongoing and completed clinical trials across the world.',
    icon: <FlaskConical className="h-5 w-5" />,
    databases: [
      {
        name: 'ClinicalTrials.gov',
        description: 'US National Library of Medicine registry and results database for clinical studies conducted worldwide.',
        url: 'https://clinicaltrials.gov/',
        tags: ['US', 'clinical trials', 'NLM'],
      },
      {
        name: 'WHO ICTRP',
        description: 'WHO International Clinical Trials Registry Platform linking trial registries from around the world.',
        url: 'https://www.who.int/clinical-trials-registry-platform',
        tags: ['WHO', 'international', 'meta-registry'],
      },
      {
        name: 'ChiCTR (Chinese Clinical Trial Registry)',
        description: 'Primary registry for clinical trials conducted in China, a WHO ICTRP primary registry.',
        url: 'https://www.chictr.org.cn/',
        tags: ['China', 'clinical trials', 'WHO primary registry'],
      },
      {
        name: 'ISRCTN',
        description: 'Primary clinical trial registry recognized by WHO and ICMJE, assigning globally unique ISRCTN identifiers.',
        url: 'https://www.isrctn.com/',
        tags: ['international', 'trial registration', 'ICMJE'],
      },
      {
        name: 'CTIS / EU Clinical Trials Information System',
        description: 'European Union single-entry portal for clinical trial applications and information under the EU Clinical Trials Regulation.',
        url: 'https://euclinicaltrials.eu/',
        tags: ['EU', 'clinical trials', 'regulatory'],
      },
    ],
  },
  {
    title: 'East Asian Databases',
    description: 'Critical databases for accessing acupuncture and traditional medicine research from China, Korea, and Japan.',
    icon: <Globe className="h-5 w-5" />,
    databases: [
      {
        name: 'CNKI / CAJ',
        description: 'China National Knowledge Infrastructure -- the largest Chinese academic database covering journals, dissertations, and conferences.',
        url: 'https://www.cnki.net/',
        tags: ['China', 'academic', 'journals', 'dissertations'],
      },
      {
        name: 'Wanfang',
        description: 'Major Chinese database providing access to academic journals, dissertations, conference papers, and standards.',
        url: 'https://www.wanfangdata.com.cn/',
        tags: ['China', 'journals', 'dissertations', 'standards'],
      },
      {
        name: 'CQVIP / VIP',
        description: 'Chinese scientific and technical journal database covering a wide range of disciplines including traditional medicine.',
        url: 'https://www.cqvip.com/',
        tags: ['China', 'scientific journals', 'traditional medicine'],
      },
      {
        name: 'SinoMed / CBM',
        description: 'Chinese Biomedical Literature Database -- the most authoritative Chinese biomedical database operated by the Chinese Medical Association.',
        url: 'http://www.sinomed.ac.cn/',
        tags: ['China', 'biomedical', 'CMA'],
      },
      {
        name: 'KoreaMed',
        description: 'Korean medical literature database providing access to Korean medical journals indexed by the Korean Association of Medical Journal Editors.',
        url: 'https://koreamed.org/',
        tags: ['Korea', 'medical journals', 'KAMJE'],
      },
      {
        name: 'OASIS',
        description: 'Korean traditional medicine database covering traditional Korean, Chinese, and integrative medicine research.',
        url: 'https://oasis.kiom.re.kr/',
        tags: ['Korea', 'traditional medicine', 'integrative medicine'],
      },
      {
        name: 'J-STAGE',
        description: 'Japan Science and Technology Agency platform hosting Japanese scholarly journals, many with English abstracts.',
        url: 'https://www.jstage.jst.go.jp/',
        tags: ['Japan', 'scholarly journals', 'open access'],
      },
    ],
  },
  {
    title: 'Core Journals',
    description: 'Key peer-reviewed journals dedicated to acupuncture, meridian studies, and integrative medicine.',
    icon: <Newspaper className="h-5 w-5" />,
    databases: [
      {
        name: 'Acupuncture in Medicine',
        description: 'BMJ-published journal focusing on scientific evaluation of acupuncture and related techniques in clinical practice.',
        url: 'https://journals.sagepub.com/home/aim',
        tags: ['acupuncture', 'clinical practice', 'BMJ'],
      },
      {
        name: 'Medical Acupuncture',
        description: 'Peer-reviewed journal covering clinical and scientific aspects of acupuncture and related interventions.',
        url: 'https://www.liebertpub.com/loi/acu',
        tags: ['acupuncture', 'clinical', 'scientific'],
      },
      {
        name: 'Journal of Acupuncture Research (JAR)',
        description: 'Official journal of the Korean Acupuncture and Moxibustion Medicine Society publishing original research and reviews.',
        url: 'https://www.jar.or.kr/',
        tags: ['acupuncture', 'moxibustion', 'Korean'],
      },
      {
        name: 'Journal of Acupuncture and Meridian Studies',
        description: 'International journal publishing research on acupuncture mechanisms, meridian studies, and related therapies.',
        url: 'https://www.jams-kpi.com/',
        tags: ['meridian studies', 'acupuncture mechanisms', 'international'],
      },
      {
        name: 'World Journal of Acupuncture-Moxibustion',
        description: 'English-language journal published in China covering acupuncture-moxibustion clinical and experimental research.',
        url: 'https://www.sciencedirect.com/journal/world-journal-of-acupuncture-moxibustion',
        tags: ['acupuncture', 'moxibustion', 'China'],
      },
      {
        name: 'Journal of Integrative Medicine',
        description: 'International peer-reviewed journal covering integrative medicine, combining conventional and complementary approaches.',
        url: 'https://www.sciencedirect.com/journal/journal-of-integrative-medicine',
        tags: ['integrative medicine', 'complementary medicine', 'international'],
      },
    ],
  },
]

export default function ResearchDatabasesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query && !activeCategory) return categories

    return categories
      .filter((cat) => !activeCategory || cat.title === activeCategory)
      .map((cat) => {
        if (!query) return cat
        const filtered = cat.databases.filter(
          (db) =>
            db.name.toLowerCase().includes(query) ||
            db.description.toLowerCase().includes(query) ||
            db.tags.some((tag) => tag.toLowerCase().includes(query))
        )
        return { ...cat, databases: filtered }
      })
      .filter((cat) => cat.databases.length > 0)
  }, [searchQuery, activeCategory])

  const totalDatabases = categories.reduce((sum, cat) => sum + cat.databases.length, 0)
  const visibleDatabases = filteredCategories.reduce((sum, cat) => sum + cat.databases.length, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Research Databases</h1>
        <p className="text-muted-foreground mt-2">
          {totalDatabases} academic databases and journals for acupuncture and evidence-based medicine research
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search databases, topics, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveCategory(null)}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.title}
              variant={activeCategory === cat.title ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                setActiveCategory(activeCategory === cat.title ? null : cat.title)
              }
            >
              {cat.title.replace(/ \(.*?\)/, '').split(' ').slice(0, 3).join(' ')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results count when filtering */}
      {(searchQuery || activeCategory) && (
        <p className="text-sm text-muted-foreground">
          Showing {visibleDatabases} of {totalDatabases} databases
        </p>
      )}

      {/* Database Categories */}
      <div className="space-y-8">
        {filteredCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {category.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.databases.map((db) => (
                <Card key={db.name} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{db.name}</CardTitle>
                      <a
                        href={db.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`Open ${db.name} in new tab`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-sm leading-relaxed">
                      {db.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1.5">
                      {db.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs cursor-pointer"
                          onClick={() => setSearchQuery(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No databases found</h3>
          <p className="text-muted-foreground mt-1">
            Try a different search term or clear your filters.
          </p>
        </div>
      )}
    </div>
  )
}
