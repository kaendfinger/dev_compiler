var DeltaBlue;
(function(exports) {
  'use strict';
  // Function main: () → dynamic
  function main() {
    new DeltaBlue().report();
  }
  class DeltaBlue extends BenchmarkBase.BenchmarkBase {
    DeltaBlue() {
      super.BenchmarkBase("DeltaBlue");
    }
    run() {
      chainTest(100);
      projectionTest(100);
    }
  }
  class Strength extends core.Object {
    Strength(value, name) {
      this.value = value;
      this.name = name;
    }
    nextWeaker() {
      return /* Unimplemented const */new core.List$(Strength).from([STRONG_PREFERRED, PREFERRED, STRONG_DEFAULT, NORMAL, WEAK_DEFAULT, WEAKEST])[core.$get](this.value);
    }
    static stronger(s1, s2) {
      return dart.notNull(s1.value) < dart.notNull(s2.value);
    }
    static weaker(s1, s2) {
      return dart.notNull(s1.value) > dart.notNull(s2.value);
    }
    static weakest(s1, s2) {
      return Strength.weaker(s1, s2) ? s1 : s2;
    }
    static strongest(s1, s2) {
      return Strength.stronger(s1, s2) ? s1 : s2;
    }
  }
  let REQUIRED = new Strength(0, "required");
  let STRONG_PREFERRED = new Strength(1, "strongPreferred");
  let PREFERRED = new Strength(2, "preferred");
  let STRONG_DEFAULT = new Strength(3, "strongDefault");
  let NORMAL = new Strength(4, "normal");
  let WEAK_DEFAULT = new Strength(5, "weakDefault");
  let WEAKEST = new Strength(6, "weakest");
  class Constraint extends core.Object {
    Constraint(strength) {
      this.strength = strength;
    }
    addConstraint() {
      this.addToGraph();
      exports.planner.incrementalAdd(this);
    }
    satisfy(mark) {
      this.chooseMethod(dart.as(mark, core.int));
      if (!dart.notNull(this.isSatisfied())) {
        if (dart.equals(this.strength, REQUIRED)) {
          core.print("Could not satisfy a required constraint!");
        }
        return null;
      }
      this.markInputs(dart.as(mark, core.int));
      let out = this.output();
      let overridden = out.determinedBy;
      if (overridden != null)
        overridden.markUnsatisfied();
      out.determinedBy = this;
      if (!dart.notNull(exports.planner.addPropagate(this, dart.as(mark, core.int))))
        core.print("Cycle encountered");
      out.mark = dart.as(mark, core.int);
      return overridden;
    }
    destroyConstraint() {
      if (this.isSatisfied())
        exports.planner.incrementalRemove(this);
      this.removeFromGraph();
    }
    isInput() {
      return false;
    }
  }
  class UnaryConstraint extends Constraint {
    UnaryConstraint(myOutput, strength) {
      this.myOutput = myOutput;
      this.satisfied = false;
      super.Constraint(strength);
      this.addConstraint();
    }
    addToGraph() {
      this.myOutput.addConstraint(this);
      this.satisfied = false;
    }
    chooseMethod(mark) {
      this.satisfied = this.myOutput.mark != mark && dart.notNull(Strength.stronger(this.strength, this.myOutput.walkStrength));
    }
    isSatisfied() {
      return this.satisfied;
    }
    markInputs(mark) {}
    output() {
      return this.myOutput;
    }
    recalculate() {
      this.myOutput.walkStrength = this.strength;
      this.myOutput.stay = !dart.notNull(this.isInput());
      if (this.myOutput.stay)
        this.execute();
    }
    markUnsatisfied() {
      this.satisfied = false;
    }
    inputsKnown(mark) {
      return true;
    }
    removeFromGraph() {
      if (this.myOutput != null)
        this.myOutput.removeConstraint(this);
      this.satisfied = false;
    }
  }
  class StayConstraint extends UnaryConstraint {
    StayConstraint(v, str) {
      super.UnaryConstraint(v, str);
    }
    execute() {}
  }
  class EditConstraint extends UnaryConstraint {
    EditConstraint(v, str) {
      super.UnaryConstraint(v, str);
    }
    isInput() {
      return true;
    }
    execute() {}
  }
  let NONE = 1;
  let FORWARD = 2;
  let BACKWARD = 0;
  class BinaryConstraint extends Constraint {
    BinaryConstraint(v1, v2, strength) {
      this.v1 = v1;
      this.v2 = v2;
      this.direction = NONE;
      super.Constraint(strength);
      this.addConstraint();
    }
    chooseMethod(mark) {
      if (this.v1.mark == mark) {
        this.direction = this.v2.mark != mark && dart.notNull(Strength.stronger(this.strength, this.v2.walkStrength)) ? FORWARD : NONE;
      }
      if (this.v2.mark == mark) {
        this.direction = this.v1.mark != mark && dart.notNull(Strength.stronger(this.strength, this.v1.walkStrength)) ? BACKWARD : NONE;
      }
      if (Strength.weaker(this.v1.walkStrength, this.v2.walkStrength)) {
        this.direction = Strength.stronger(this.strength, this.v1.walkStrength) ? BACKWARD : NONE;
      } else {
        this.direction = Strength.stronger(this.strength, this.v2.walkStrength) ? FORWARD : BACKWARD;
      }
    }
    addToGraph() {
      this.v1.addConstraint(this);
      this.v2.addConstraint(this);
      this.direction = NONE;
    }
    isSatisfied() {
      return this.direction != NONE;
    }
    markInputs(mark) {
      this.input().mark = mark;
    }
    input() {
      return this.direction == FORWARD ? this.v1 : this.v2;
    }
    output() {
      return this.direction == FORWARD ? this.v2 : this.v1;
    }
    recalculate() {
      let ihn = this.input(), out = this.output();
      out.walkStrength = Strength.weakest(this.strength, ihn.walkStrength);
      out.stay = ihn.stay;
      if (out.stay)
        this.execute();
    }
    markUnsatisfied() {
      this.direction = NONE;
    }
    inputsKnown(mark) {
      let i = this.input();
      return i.mark == mark || dart.notNull(i.stay) || dart.notNull(i.determinedBy == null);
    }
    removeFromGraph() {
      if (this.v1 != null)
        this.v1.removeConstraint(this);
      if (this.v2 != null)
        this.v2.removeConstraint(this);
      this.direction = NONE;
    }
  }
  class ScaleConstraint extends BinaryConstraint {
    ScaleConstraint(src, scale, offset, dest, strength) {
      this.scale = scale;
      this.offset = offset;
      super.BinaryConstraint(src, dest, strength);
    }
    addToGraph() {
      super.addToGraph();
      this.scale.addConstraint(this);
      this.offset.addConstraint(this);
    }
    removeFromGraph() {
      super.removeFromGraph();
      if (this.scale != null)
        this.scale.removeConstraint(this);
      if (this.offset != null)
        this.offset.removeConstraint(this);
    }
    markInputs(mark) {
      super.markInputs(mark);
      this.scale.mark = this.offset.mark = mark;
    }
    execute() {
      if (this.direction == FORWARD) {
        this.v2.value = dart.notNull(this.v1.value) * dart.notNull(this.scale.value) + dart.notNull(this.offset.value);
      } else {
        this.v1.value = ((dart.notNull(this.v2.value) - dart.notNull(this.offset.value)) / dart.notNull(this.scale.value)).truncate();
      }
    }
    recalculate() {
      let ihn = this.input(), out = this.output();
      out.walkStrength = Strength.weakest(this.strength, ihn.walkStrength);
      out.stay = dart.notNull(ihn.stay) && dart.notNull(this.scale.stay) && dart.notNull(this.offset.stay);
      if (out.stay)
        this.execute();
    }
  }
  class EqualityConstraint extends BinaryConstraint {
    EqualityConstraint(v1, v2, strength) {
      super.BinaryConstraint(v1, v2, strength);
    }
    execute() {
      this.output().value = this.input().value;
    }
  }
  class Variable extends core.Object {
    Variable(name, value) {
      this.constraints = new core.List$(Constraint).from([]);
      this.name = name;
      this.value = value;
      this.determinedBy = null;
      this.mark = 0;
      this.walkStrength = WEAKEST;
      this.stay = true;
    }
    addConstraint(c) {
      this.constraints[core.$add](c);
    }
    removeConstraint(c) {
      this.constraints[core.$remove](c);
      if (dart.equals(this.determinedBy, c))
        this.determinedBy = null;
    }
  }
  class Planner extends core.Object {
    Planner() {
      this.currentMark = 0;
    }
    incrementalAdd(c) {
      let mark = this.newMark();
      for (let overridden = c.satisfy(mark); overridden != null; overridden = overridden.satisfy(mark))
        ;
    }
    incrementalRemove(c) {
      let out = c.output();
      c.markUnsatisfied();
      c.removeFromGraph();
      let unsatisfied = this.removePropagateFrom(out);
      let strength = REQUIRED;
      do {
        for (let i = 0; dart.notNull(i) < dart.notNull(unsatisfied[core.$length]); i = dart.notNull(i) + 1) {
          let u = unsatisfied[core.$get](i);
          if (dart.equals(u.strength, strength))
            this.incrementalAdd(u);
        }
        strength = strength.nextWeaker();
      } while (!dart.equals(strength, WEAKEST));
    }
    newMark() {
      return this.currentMark = dart.notNull(this.currentMark) + 1;
    }
    makePlan(sources) {
      let mark = this.newMark();
      let plan = new Plan();
      let todo = sources;
      while (dart.notNull(todo[core.$length]) > 0) {
        let c = todo[core.$removeLast]();
        if (c.output().mark != mark && dart.notNull(c.inputsKnown(mark))) {
          plan.addConstraint(c);
          c.output().mark = mark;
          this.addConstraintsConsumingTo(c.output(), todo);
        }
      }
      return plan;
    }
    extractPlanFromConstraints(constraints) {
      let sources = new core.List$(Constraint).from([]);
      for (let i = 0; dart.notNull(i) < dart.notNull(constraints[core.$length]); i = dart.notNull(i) + 1) {
        let c = constraints[core.$get](i);
        if (dart.notNull(c.isInput()) && dart.notNull(c.isSatisfied()))
          sources[core.$add](c);
      }
      return this.makePlan(sources);
    }
    addPropagate(c, mark) {
      let todo = new core.List$(Constraint).from([c]);
      while (dart.notNull(todo[core.$length]) > 0) {
        let d = todo[core.$removeLast]();
        if (d.output().mark == mark) {
          this.incrementalRemove(c);
          return false;
        }
        d.recalculate();
        this.addConstraintsConsumingTo(d.output(), todo);
      }
      return true;
    }
    removePropagateFrom(out) {
      out.determinedBy = null;
      out.walkStrength = WEAKEST;
      out.stay = true;
      let unsatisfied = new core.List$(Constraint).from([]);
      let todo = new core.List$(Variable).from([out]);
      while (dart.notNull(todo[core.$length]) > 0) {
        let v = todo[core.$removeLast]();
        for (let i = 0; dart.notNull(i) < dart.notNull(v.constraints[core.$length]); i = dart.notNull(i) + 1) {
          let c = v.constraints[core.$get](i);
          if (!dart.notNull(c.isSatisfied()))
            unsatisfied[core.$add](c);
        }
        let determining = v.determinedBy;
        for (let i = 0; dart.notNull(i) < dart.notNull(v.constraints[core.$length]); i = dart.notNull(i) + 1) {
          let next = v.constraints[core.$get](i);
          if (dart.notNull(!dart.equals(next, determining)) && dart.notNull(next.isSatisfied())) {
            next.recalculate();
            todo[core.$add](next.output());
          }
        }
      }
      return unsatisfied;
    }
    addConstraintsConsumingTo(v, coll) {
      let determining = v.determinedBy;
      for (let i = 0; dart.notNull(i) < dart.notNull(v.constraints[core.$length]); i = dart.notNull(i) + 1) {
        let c = v.constraints[core.$get](i);
        if (dart.notNull(!dart.equals(c, determining)) && dart.notNull(c.isSatisfied()))
          coll[core.$add](c);
      }
    }
  }
  class Plan extends core.Object {
    Plan() {
      this.list = new core.List$(Constraint).from([]);
    }
    addConstraint(c) {
      this.list[core.$add](c);
    }
    size() {
      return this.list[core.$length];
    }
    execute() {
      for (let i = 0; dart.notNull(i) < dart.notNull(this.list[core.$length]); i = dart.notNull(i) + 1) {
        this.list[core.$get](i).execute();
      }
    }
  }
  // Function chainTest: (int) → void
  function chainTest(n) {
    exports.planner = new Planner();
    let prev = null, first = null, last = null;
    for (let i = 0; dart.notNull(i) <= dart.notNull(n); i = dart.notNull(i) + 1) {
      let v = new Variable("v", 0);
      if (prev != null)
        new EqualityConstraint(prev, v, REQUIRED);
      if (i == 0)
        first = v;
      if (i == n)
        last = v;
      prev = v;
    }
    new StayConstraint(last, STRONG_DEFAULT);
    let edit = new EditConstraint(first, PREFERRED);
    let plan = exports.planner.extractPlanFromConstraints(new core.List$(Constraint).from([edit]));
    for (let i = 0; dart.notNull(i) < 100; i = dart.notNull(i) + 1) {
      first.value = i;
      plan.execute();
      if (last.value != i) {
        core.print("Chain test failed:");
        core.print(`Expected last value to be ${i} but it was ${last.value}.`);
      }
    }
  }
  // Function projectionTest: (int) → void
  function projectionTest(n) {
    exports.planner = new Planner();
    let scale = new Variable("scale", 10);
    let offset = new Variable("offset", 1000);
    let src = null, dst = null;
    let dests = new core.List$(Variable).from([]);
    for (let i = 0; dart.notNull(i) < dart.notNull(n); i = dart.notNull(i) + 1) {
      src = new Variable("src", i);
      dst = new Variable("dst", i);
      dests[core.$add](dst);
      new StayConstraint(src, NORMAL);
      new ScaleConstraint(src, scale, offset, dst, REQUIRED);
    }
    change(src, 17);
    if (dst.value != 1170)
      core.print("Projection 1 failed");
    change(dst, 1050);
    if (src.value != 5)
      core.print("Projection 2 failed");
    change(scale, 5);
    for (let i = 0; dart.notNull(i) < dart.notNull(n) - 1; i = dart.notNull(i) + 1) {
      if (dests[core.$get](i).value != dart.notNull(i) * 5 + 1000)
        core.print("Projection 3 failed");
    }
    change(offset, 2000);
    for (let i = 0; dart.notNull(i) < dart.notNull(n) - 1; i = dart.notNull(i) + 1) {
      if (dests[core.$get](i).value != dart.notNull(i) * 5 + 2000)
        core.print("Projection 4 failed");
    }
  }
  // Function change: (Variable, int) → void
  function change(v, newValue) {
    let edit = new EditConstraint(v, PREFERRED);
    let plan = exports.planner.extractPlanFromConstraints(new core.List$(EditConstraint).from([edit]));
    for (let i = 0; dart.notNull(i) < 10; i = dart.notNull(i) + 1) {
      v.value = newValue;
      plan.execute();
    }
    edit.destroyConstraint();
  }
  exports.planner = null;
  // Exports:
  exports.main = main;
  exports.DeltaBlue = DeltaBlue;
  exports.Strength = Strength;
  exports.REQUIRED = REQUIRED;
  exports.STRONG_PREFERRED = STRONG_PREFERRED;
  exports.PREFERRED = PREFERRED;
  exports.STRONG_DEFAULT = STRONG_DEFAULT;
  exports.NORMAL = NORMAL;
  exports.WEAK_DEFAULT = WEAK_DEFAULT;
  exports.WEAKEST = WEAKEST;
  exports.Constraint = Constraint;
  exports.UnaryConstraint = UnaryConstraint;
  exports.StayConstraint = StayConstraint;
  exports.EditConstraint = EditConstraint;
  exports.NONE = NONE;
  exports.FORWARD = FORWARD;
  exports.BACKWARD = BACKWARD;
  exports.BinaryConstraint = BinaryConstraint;
  exports.ScaleConstraint = ScaleConstraint;
  exports.EqualityConstraint = EqualityConstraint;
  exports.Variable = Variable;
  exports.Planner = Planner;
  exports.Plan = Plan;
  exports.chainTest = chainTest;
  exports.projectionTest = projectionTest;
  exports.change = change;
})(DeltaBlue || (DeltaBlue = {}));
