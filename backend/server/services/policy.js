export function evaluate(policy, proposal, spentThisMonth = 0) {
  const { amount, category } = proposal;

  if (policy.expires_at && new Date(policy.expires_at) < new Date()) {
    return { decision: 'BLOCK', reason: 'The mandate has expired.' };
  }
  const allowed = (policy.allowed_categories || []).map(c => c.toLowerCase());
  if (allowed.length && !allowed.includes(String(category).toLowerCase())) {
    return { decision: 'BLOCK', reason: `Category "${category}" is not allowed by your mandate.` };
  }
  if (amount > policy.per_purchase_limit) {
    return { decision: 'BLOCK', reason: `$${amount} is above the per-purchase limit of $${policy.per_purchase_limit}.` };
  }
  if (spentThisMonth + amount > policy.monthly_limit) {
    return { decision: 'BLOCK', reason: `This would exceed the monthly limit of $${policy.monthly_limit}.` };
  }
  if (amount > policy.approval_threshold) {
    return { decision: 'NEEDS_APPROVAL', reason: `$${amount} is above your approval threshold of $${policy.approval_threshold}.` };
  }
  return { decision: 'APPROVE', reason: 'Within all limits of your mandate.' };
}