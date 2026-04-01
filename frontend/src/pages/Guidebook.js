import { BookOpen, TrendingUp, CloudRain, Leaf } from 'lucide-react';

const Guidebook = () => {
  const guides = [
    {
      id: 1,
      icon: TrendingUp,
      title: 'Maximizing Profits in Modern Farming',
      sections: [
        {
          heading: '1. Crop Selection & Market Analysis',
          content:
            'Choose crops based on market demand and local soil conditions. Use profit predictors to compare potential earnings. High-value crops like hybrid tomatoes typically yield 40-60% more profit than traditional varieties.',
        },
        {
          heading: '2. Precision Agriculture Technology',
          content:
            'Implement drip irrigation to reduce water usage by 30-50%. Use soil sensors to optimize fertilizer application. Smart farming tools can increase yields by 20-35% while reducing input costs.',
        },
        {
          heading: '3. Cost Optimization',
          content:
            'Buy inputs in bulk during off-season for 15-20% savings. Share equipment rentals with neighboring farms. Use organic alternatives to reduce chemical fertilizer costs by 25-40%.',
        },
        {
          heading: '4. Value Addition',
          content:
            'Process raw produce into value-added products (dried, packaged, organic certified). Direct-to-consumer sales can increase profit margins by 30-50% compared to wholesale.',
        },
        {
          heading: '5. Diversification Strategy',
          content:
            "Don't put all eggs in one basket. Grow 2-3 different crops to spread risk. Consider integrated farming (crops + livestock) for multiple income streams.",
        },
      ],
    },
    {
      id: 2,
      icon: CloudRain,
      title: 'Farming in Changing Climate',
      sections: [
        {
          heading: '1. Climate-Resilient Crop Varieties',
          content:
            'Select drought-resistant and heat-tolerant varieties. Hybrid seeds often have better climate adaptability. Consider short-duration crops to avoid extreme weather windows.',
        },
        {
          heading: '2. Water Conservation',
          content:
            'Install rainwater harvesting systems (ROI in 2-3 years). Use mulching to reduce evaporation by 50-70%. Drip irrigation reduces water needs by 40-60% compared to flood irrigation.',
        },
        {
          heading: '3. Soil Health Management',
          content:
            'Build organic matter to improve water retention. Practice crop rotation to maintain soil fertility. Cover crops prevent erosion and improve soil structure during off-season.',
        },
        {
          heading: '4. Weather Monitoring',
          content:
            'Use weather forecasting apps (like Verdant!) to plan farming activities. Install weather stations for micro-climate data. Subscribe to early warning systems for extreme weather events.',
        },
        {
          heading: '5. Adaptation Techniques',
          content:
            'Shift planting dates based on rainfall patterns. Use shade nets during heat waves. Implement raised bed farming in flood-prone areas. Plant windbreaks to protect against strong winds.',
        },
        {
          heading: '6. Insurance & Risk Management',
          content:
            'Enroll in crop insurance schemes (PMFBY in India). Maintain emergency funds equal to 20-30% of annual costs. Diversify income sources to buffer against climate shocks.',
        },
      ],
    },
    {
      id: 3,
      icon: Leaf,
      title: 'Sustainable Farming Practices',
      sections: [
        {
          heading: '1. Organic Farming Benefits',
          content:
            'Organic produce commands 20-40% premium prices. Reduces input costs by 25-35% after initial transition period. Improves long-term soil health and farmer wellbeing.',
        },
        {
          heading: '2. Integrated Pest Management',
          content:
            'Use biological controls (neem, beneficial insects) before chemicals. Monitor pest populations regularly. Apply pesticides only when threshold levels are reached, reducing usage by 40-60%.',
        },
        {
          heading: '3. Composting & Natural Fertilizers',
          content:
            'Convert farm waste into compost (saves 30-40% on fertilizer costs). Use vermicompost for high-quality organic matter. Green manuring improves soil nitrogen naturally.',
        },
        {
          heading: '4. Biodiversity Conservation',
          content:
            'Maintain hedgerows and trees on farm boundaries. Preserve natural pollinators (increases yield by 15-30%). Create habitat for natural pest predators.',
        },
      ],
    },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Farming Guidebook
        </h2>
        <p className="text-slate-600 mt-2">
          Comprehensive guides to help you succeed in modern agriculture
        </p>
      </div>

      <div className="space-y-6">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <div
              key={guide.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              data-testid={`guide-${guide.id}`}
            >
              <div className="bg-gradient-to-r from-[#064E3B] to-[#065F46] p-6 text-white">
                <div className="flex items-center gap-3">
                  <Icon size={32} />
                  <h3 className="text-2xl font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {guide.title}
                  </h3>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {guide.sections.map((section, index) => (
                  <div key={index} className="pb-6 border-b border-slate-200 last:border-0">
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">
                      {section.heading}
                    </h4>
                    <p className="text-slate-700 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Resources */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="text-green-700 flex-shrink-0 mt-1" size={24} />
          <div>
            <h4 className="text-lg font-semibold text-green-900 mb-2">Need More Help?</h4>
            <p className="text-green-800 mb-4">
              Our team of agricultural experts is here to help you succeed. Contact support for
              personalized advice on your farming challenges.
            </p>
            <a
              href="#"
              className="inline-block px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              Contact Expert Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidebook;